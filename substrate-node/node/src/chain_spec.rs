use sp_core::{Pair, Public, sr25519};
use siip_node_runtime::{
	AccountId, BalancesConfig, GenesisConfig,
	SudoConfig, SystemConfig, WASM_BINARY, Signature
};
use sp_runtime::traits::{BlakeTwo256, IdentifyAccount, Verify};
use sc_service::ChainType;

#[cfg(test)]
use frame_support::{assert_err};

// The URL for the telemetry server.
// const STAGING_TELEMETRY_URL: &str = "wss://telemetry.polkadot.io/submit/";

/// Specialized `ChainSpec`. This is a specialization of the general Substrate ChainSpec type.
pub type ChainSpec = sc_service::GenericChainSpec<GenesisConfig>;

/// Generate a crypto pair from seed.
pub fn get_from_seed<TPublic: Public>(seed: &str) -> <TPublic::Pair as Pair>::Public {
	TPublic::Pair::from_string(&format!("//{}", seed), None)
		.expect("static values are valid; qed")
		.public()
}

type AccountPublic = <Signature as Verify>::Signer;

/// Generate an account ID from seed.
pub fn get_account_id_from_seed<TPublic: Public>(seed: &str) -> AccountId where
	AccountPublic: From<<TPublic::Pair as Pair>::Public>
{
	AccountPublic::from(get_from_seed::<TPublic>(seed)).into_account()
}

pub fn development_config() -> Result<ChainSpec, String> {
	let wasm_binary = WASM_BINARY.ok_or("Development wasm binary not available".to_string())?;

	Ok(ChainSpec::from_genesis(
		// Name
		"Development",
		// ID
		"dev",
		ChainType::Development,
		move || testnet_genesis(
			wasm_binary,
			// Sudo account
			get_account_id_from_seed::<sr25519::Public>("Alice"),
			// Pre-funded accounts
			vec![
				get_account_id_from_seed::<sr25519::Public>("Alice"),
				get_account_id_from_seed::<sr25519::Public>("Bob"),
				get_account_id_from_seed::<sr25519::Public>("Alice//stash"),
				get_account_id_from_seed::<sr25519::Public>("Bob//stash"),
			],
			true,
		),
		// Bootnodes
		vec![],
		// Telemetry
		None,
		// Protocol ID
		None,
		// Properties
		None,
		// Extensions
		None,
	))
}

pub fn local_testnet_config() -> Result<ChainSpec, String> {
	let wasm_binary = WASM_BINARY.ok_or("Development wasm binary not available".to_string())?;

	Ok(ChainSpec::from_genesis(
		// Name
		"Local Testnet",
		// ID
		"local_testnet",
		ChainType::Local,
		move || testnet_genesis(
			wasm_binary,
			// Sudo account
			get_account_id_from_seed::<sr25519::Public>("Alice"),
			// Pre-funded accounts
			vec![
				get_account_id_from_seed::<sr25519::Public>("Alice"),
				get_account_id_from_seed::<sr25519::Public>("Bob"),
				get_account_id_from_seed::<sr25519::Public>("Charlie"),
				get_account_id_from_seed::<sr25519::Public>("Dave"),
				get_account_id_from_seed::<sr25519::Public>("Eve"),
				get_account_id_from_seed::<sr25519::Public>("Ferdie"),
				get_account_id_from_seed::<sr25519::Public>("Alice//stash"),
				get_account_id_from_seed::<sr25519::Public>("Bob//stash"),
				get_account_id_from_seed::<sr25519::Public>("Charlie//stash"),
				get_account_id_from_seed::<sr25519::Public>("Dave//stash"),
				get_account_id_from_seed::<sr25519::Public>("Eve//stash"),
				get_account_id_from_seed::<sr25519::Public>("Ferdie//stash"),
			],
			true,
		),
		// Bootnodes
		vec![],
		// Telemetry
		None,
		// Protocol ID
		None,
		// Properties
		None,
		// Extensions
		None,
	))
}

/// Configure initial storage state for FRAME modules.
fn testnet_genesis(
	wasm_binary: &[u8],
	root_key: AccountId,
	endowed_accounts: Vec<AccountId>,
	_enable_println: bool,
) -> GenesisConfig {
	GenesisConfig {
		frame_system: Some(SystemConfig {
			// Add Wasm runtime to storage.
			code: wasm_binary.to_vec(),
			changes_trie_config: Default::default(),
		}),
		pallet_balances: Some(BalancesConfig {
			// Configure endowed accounts with initial balance of 1 << 50.
			balances: endowed_accounts.iter().cloned().map(|k|(k, 1 << 50)).collect(),
		}),
		pallet_sudo: Some(SudoConfig {
			// Assign network admin rights.
			key: root_key,
		}),
	}
}


#[cfg(test)]
use siip_node_runtime::BuildStorage;
#[cfg(test)]
use sp_block_builder::runtime_decl_for_BlockBuilder::BlockBuilder;
use sp_api::{Encode, runtime_decl_for_Core::Core};
use sp_trie::TrieConfiguration;
#[cfg(test)]
fn new_test_ext() -> sp_io::TestExternalities {
	let wasm_binary = WASM_BINARY.unwrap();

	let gen = testnet_genesis(
		wasm_binary,
		// Sudo account
		get_account_id_from_seed::<sr25519::Public>("Alice"),
		// Pre-funded accounts
		vec![
			get_account_id_from_seed::<sr25519::Public>("Alice"),
			get_account_id_from_seed::<sr25519::Public>("Bob"),
			get_account_id_from_seed::<sr25519::Public>("Charlie"),
			get_account_id_from_seed::<sr25519::Public>("Dave"),
			get_account_id_from_seed::<sr25519::Public>("Eve"),
			get_account_id_from_seed::<sr25519::Public>("Ferdie"),
			get_account_id_from_seed::<sr25519::Public>("Alice//stash"),
			get_account_id_from_seed::<sr25519::Public>("Bob//stash"),
			get_account_id_from_seed::<sr25519::Public>("Charlie//stash"),
			get_account_id_from_seed::<sr25519::Public>("Dave//stash"),
			get_account_id_from_seed::<sr25519::Public>("Eve//stash"),
			get_account_id_from_seed::<sr25519::Public>("Ferdie//stash"),
		],
		true,
	);
	let storage = gen.build_storage().unwrap();
	sp_io::TestExternalities::from(storage)
}

// fn construct_block(
// 	number: siip_node_runtime::BlockNumber,
// 	parent_hash: siip_node_runtime::Hash,
// 	extrinsics: Vec<<sp_runtime::generic::Block<sp_runtime::generic::Header<u32, BlakeTwo256>, sp_runtime::generic::UncheckedExtrinsic<siip_node_runtime::multiaddress::MultiAddress<<<MultiSignature as Verify>::Signer as IdentifyAccount>::AccountId, ()>, siip_node_runtime::Call, MultiSignature, (frame_system::extensions::check_spec_version::CheckSpecVersion<siip_node_runtime::Runtime>, frame_system::extensions::check_tx_version::CheckTxVersion<siip_node_runtime::Runtime>, frame_system::extensions::check_genesis::CheckGenesis<siip_node_runtime::Runtime>, frame_system::extensions::check_mortality::CheckMortality<siip_node_runtime::Runtime>, frame_system::extensions::check_nonce::CheckNonce<siip_node_runtime::Runtime>, frame_system::extensions::check_weight::CheckWeight<siip_node_runtime::Runtime>, pallet_transaction_payment::ChargeTransactionPayment<siip_node_runtime::Runtime>, siip_node_runtime::reward_miner::RewardMiner<siip_node_runtime::Runtime>)>> as Trait>::Extrinsic>
// ) -> siip_node_runtime::Block {

// 	let extrinsics_root = sp_trie::Layout::<BlakeTwo256>::ordered_trie_root(extrinsics.iter().map(codec::Encode::encode)).to_fixed_bytes().into();


// 	let x = siip_node_runtime::ClientBuilder::new();
// 	let header = siip_node_runtime::Header {
// 		parent_hash,
// 		number,
// 		state_root: Default::default(),
// 		extrinsics_root,
// 		digest
// 	};
// }

#[test]
fn bla() {
	new_test_ext().execute_with(|| {
		let register = siip_node_runtime::pallet_siip::Call::register_certificate(
			"Sam".chars().map(|c| c as u8).collect(),
			"abc.com".chars().map(|c| c as u8).collect(),
			"127.0.0.1".chars().map(|c| c as u8).collect(),
			"{}".chars().map(|c| c as u8).collect(),
			"abcdef".chars().map(|c| c as u8).collect()
		);
		let r = siip_node_runtime::Call::SiipModule(register);

		let extrinsic = siip_node_runtime::UncheckedExtrinsic {
			function: r,
			signature: None
		};
		println!("abc");

		match siip_node_runtime::Runtime::apply_extrinsic(extrinsic.clone()) {
			Ok(_) => println!("yes"),
			Err(_) => println!("no")
		};
		match siip_node_runtime::Runtime::apply_extrinsic(extrinsic.clone()) {
			Ok(_) => println!("yes"),
			Err(_) => println!("no")
		};

		let x = siip_node_runtime::Runtime::finalize_block();

		let b = siip_node_runtime::Block {
			header: x,
			extrinsics: vec![extrinsic]
		};

		siip_node_runtime::Runtime::execute_block(b);
		// assert_err!(siip_node_runtime::Runtime::apply_extrinsic(extrinsic), "bla");
	});
}