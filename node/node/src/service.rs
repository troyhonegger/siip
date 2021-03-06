//! Service and ServiceFactory implementation. Specialized wrapper over substrate service.

use std::sync::Arc;
use std::time::Duration;
use std::thread;
use sc_client_api::ExecutorProvider;
use siip_node_runtime::{self, opaque::Block, RuntimeApi};
use sc_service::{error::Error as ServiceError, Configuration, TaskManager};
use sc_executor::native_executor_instance;
pub use sc_executor::NativeExecutor;
use sc_keystore::LocalKeystore;
use sp_core::sr25519;

use crate::chain_spec;

mod miner;

use sha3pow::MinimalSha3Algorithm;

// Our native executor instance.
native_executor_instance!(
	pub Executor,
	siip_node_runtime::api::dispatch,
	siip_node_runtime::native_version,
	frame_benchmarking::benchmarking::HostFunctions,
);

type FullClient = sc_service::TFullClient<Block, RuntimeApi, Executor>;
type FullBackend = sc_service::TFullBackend<Block>;
type FullSelectChain = sc_consensus::LongestChain<FullBackend, Block>;

pub fn new_partial(config: &Configuration) -> Result<sc_service::PartialComponents<
	FullClient, FullBackend, FullSelectChain,
	sp_consensus::DefaultImportQueue<Block, FullClient>,
	sc_transaction_pool::FullPool<Block, FullClient>,
	(
		sc_consensus_pow::PowBlockImport<
			Block,
			Arc<FullClient>,
			FullClient,
			FullSelectChain,
			MinimalSha3Algorithm,
			impl sp_consensus::CanAuthorWith<Block>
		>,
	)
>, ServiceError> {
	if config.keystore_remote.is_some() {
		return Err(ServiceError::Other(
			format!("Remote Keystores are not supported.")))
	}
	let inherent_data_providers = sp_inherents::InherentDataProviders::new();

	let (client, backend, keystore_container, task_manager) =
		sc_service::new_full_parts::<Block, RuntimeApi, Executor>(&config)?;
	let client = Arc::new(client);

	let select_chain = sc_consensus::LongestChain::new(backend.clone());

	let transaction_pool = sc_transaction_pool::BasicPool::new_full(
		config.transaction_pool.clone(),
		config.role.is_authority().into(),
		config.prometheus_registry(),
		task_manager.spawn_handle(),
		client.clone(),
	);

	let can_author_with = sp_consensus::CanAuthorWithNativeVersion::new(client.executor().clone());

	let pow_block_import = sc_consensus_pow::PowBlockImport::new(
		client.clone(),
		client.clone(),
		MinimalSha3Algorithm,
		0, // check inherents starting at block 0
		select_chain.clone(),
		inherent_data_providers.clone(),
		can_author_with
	);

	let import_queue = sc_consensus_pow::import_queue(
		Box::new(pow_block_import.clone()),
		None,
		MinimalSha3Algorithm,
		inherent_data_providers.clone(),
		&task_manager.spawn_handle(),
		config.prometheus_registry()
	)?;

	Ok(sc_service::PartialComponents {
		client, backend, task_manager, import_queue, keystore_container, select_chain, transaction_pool,
		inherent_data_providers,
		other: (pow_block_import,),
	})
}

fn remote_keystore(_url: &String) -> Result<Arc<LocalKeystore>, &'static str> {
	// FIXME: here would the concrete keystore be built,
	//        must return a concrete type (NOT `LocalKeystore`) that
	//        implements `CryptoStore` and `SyncCryptoStore`
	Err("Remote Keystore not supported.")
}

/// Builds a new service for a full client.
pub fn new_full(config: Configuration) -> Result<TaskManager, ServiceError> {
	let sc_service::PartialComponents {
		client, backend, mut task_manager, import_queue, mut keystore_container, select_chain, transaction_pool,
		inherent_data_providers,
		other: (block_import, ),
	} = new_partial(&config)?;

	if let Some(url) = &config.keystore_remote {
		match remote_keystore(url) {
			Ok(k) => keystore_container.set_remote_keystore(k),
			Err(e) => {
				return Err(ServiceError::Other(
					format!("Error hooking up remote keystore for {}: {}", url, e)))
			}
		};
	}

	let (network, network_status_sinks, system_rpc_tx, network_starter) =
		sc_service::build_network(sc_service::BuildNetworkParams {
			config: &config,
			client: client.clone(),
			transaction_pool: transaction_pool.clone(),
			spawn_handle: task_manager.spawn_handle(),
			import_queue,
			on_demand: None,
			block_announce_validator_builder: None,
		})?;

	if config.offchain_worker.enabled {
		sc_service::build_offchain_workers(
			&config, backend.clone(), task_manager.spawn_handle(), client.clone(), network.clone(),
		);
	}

	let role = config.role.clone();
	let _backoff_authoring_blocks: Option<()> = None;
	let name = config.network.node_name.clone();
	let prometheus_registry = config.prometheus_registry().cloned();

	let rpc_extensions_builder = {
		let client = client.clone();
		let pool = transaction_pool.clone();

		Box::new(move |deny_unsafe, _| {
			let deps = crate::rpc::FullDeps {
				client: client.clone(),
				pool: pool.clone(),
				deny_unsafe,
			};

			crate::rpc::create_full(deps)
		})
	};

	let (_rpc_handlers, _telemetry_connection_notifier) = sc_service::spawn_tasks(
		sc_service::SpawnTasksParams {
			network: network.clone(),
			client: client.clone(),
			keystore: keystore_container.sync_keystore(),
			task_manager: &mut task_manager,
			transaction_pool: transaction_pool.clone(),
			rpc_extensions_builder,
			on_demand: None,
			remote_blockchain: None,
			backend,
			network_status_sinks,
			system_rpc_tx,
			config,
		},
	)?;

	if role.is_authority() {
		let proposer = sc_basic_authorship::ProposerFactory::new(
			task_manager.spawn_handle(),
			client.clone(),
			transaction_pool,
			prometheus_registry.as_ref(),
		);

		let can_author_with =
			sp_consensus::CanAuthorWithNativeVersion::new(client.executor().clone());

		//TODO this generates a key matching one of the development keys in the genesis config ('//Alice', '//Bob', etc).
		// In production, this must be replaced with a random key - something like so:
		//let key_pair = keystore.write().generate_by_type::<sr25519::Pair>(sp_core::crypto::key_types::ACCOUNT)
			//.map_err(|e| ServiceError::Keystore(e))?;
		let public_key = chain_spec::get_from_seed::<sr25519::Public>(&name[..]);
			//^^^ TODO this should technically be an AccountId, but by happy coincidence that's usually the same as Public. Trouble is, AccountId doesn't have a way to convert to an array

		// NOTE: the returned worker does NOT actually do the mining (contrary to what
		// the name may imply). It just watches the transaction pool and combines
		// transactions into a block, which it then presents
		// for mining via the shared worker_data struct
		let (worker_data, worker_task) = sc_consensus_pow::start_mining_worker(
			Box::new(block_import),
			client,
			select_chain,
			MinimalSha3Algorithm,
			proposer,
			network.clone(),
			Some(public_key.to_vec()),
			inherent_data_providers,
			// time to wait for a new block before starting to mine a new one
			Duration::from_secs(10),
			// how long to take to actually build the block (i.e. executing extrinsics)
			Duration::from_secs(10),
			can_author_with);

		thread::spawn(move || {
			miner::do_mining(worker_data, MinimalSha3Algorithm);
		});

		task_manager.spawn_essential_handle().spawn_blocking("pow", worker_task);
	}

	network_starter.start_network();
	Ok(task_manager)
}

//use sp_inherents::InherentDataProviders;
//use sp_consensus_aura::sr25519::{AuthorityPair as AuraPair};
//use sc_finality_grandpa::{FinalityProofProvider as GrandpaFinalityProofProvider};

/// Builds a new service for a light client.
pub fn new_light(mut _config: Configuration) -> Result<TaskManager, ServiceError> {
	Err(ServiceError::Other("Light clients are not yet implemented (TODO)".to_string()))

	// This block comment is the node-template implementation.
	// To support light clients, it must be reworked to use POW instead of Aura/Grandpa

	/*let (client, backend, keystore, mut task_manager, on_demand) =
		sc_service::new_light_parts::<Block, RuntimeApi, Executor>(&config)?;

	let transaction_pool = Arc::new(sc_transaction_pool::BasicPool::new_light(
		config.transaction_pool.clone(),
		config.prometheus_registry(),
		task_manager.spawn_handle(),
		client.clone(),
		on_demand.clone(),
	));

	let grandpa_block_import = sc_finality_grandpa::light_block_import(
		client.clone(), backend.clone(), &(client.clone() as Arc<_>),
		Arc::new(on_demand.checker().clone()) as Arc<_>,
	)?;
	let finality_proof_import = grandpa_block_import.clone();
	let finality_proof_request_builder =
		finality_proof_import.create_finality_proof_request_builder();

	let import_queue = sc_consensus_aura::import_queue::<_, _, _, AuraPair, _, _>(
		sc_consensus_aura::slot_duration(&*client)?,
		grandpa_block_import,
		None,
		Some(Box::new(finality_proof_import)),
		client.clone(),
		InherentDataProviders::new(),
		&task_manager.spawn_handle(),
		config.prometheus_registry(),
		sp_consensus::NeverCanAuthor,
	)?;

	let finality_proof_provider =
		GrandpaFinalityProofProvider::new_for_service(backend.clone(), client.clone());

	let (network, network_status_sinks, system_rpc_tx, network_starter) =
		sc_service::build_network(sc_service::BuildNetworkParams {
			config: &config,
			client: client.clone(),
			transaction_pool: transaction_pool.clone(),
			spawn_handle: task_manager.spawn_handle(),
			import_queue,
			on_demand: Some(on_demand.clone()),
			block_announce_validator_builder: None,
			finality_proof_request_builder: Some(finality_proof_request_builder),
			finality_proof_provider: Some(finality_proof_provider),
		})?;

	if config.offchain_worker.enabled {
		sc_service::build_offchain_workers(
			&config, backend.clone(), task_manager.spawn_handle(), client.clone(), network.clone(),
		);
	}

	sc_service::spawn_tasks(sc_service::SpawnTasksParams {
		remote_blockchain: Some(backend.remote_blockchain()),
		transaction_pool,
		task_manager: &mut task_manager,
		on_demand: Some(on_demand),
		rpc_extensions_builder: Box::new(|_, _| ()),
		telemetry_connection_sinks: sc_service::TelemetryConnectionSinks::default(),
		config,
		client,
		keystore,
		backend,
		network,
		network_status_sinks,
		system_rpc_tx,
	})?;

	network_starter.start_network();

	Ok(task_manager)*/
}
