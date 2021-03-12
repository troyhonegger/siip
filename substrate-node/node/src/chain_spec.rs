use frame_benchmarking::frame_support::pallet_prelude::ValueQuery;
use sp_core::{Pair, Public, sr25519};
use siip_node_runtime::{AccountId, BalancesConfig, GenesisConfig, Signature, SudoConfig, SystemConfig, UncheckedExtrinsic, WASM_BINARY};
use sp_runtime::{MultiSignature, traits::{Verify, IdentifyAccount}};
use sc_service::ChainType;

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
	let wasm_binary = WASM_BINARY.ok_or_else(|| "Development wasm binary not available".to_string())?;

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
	let wasm_binary = WASM_BINARY.ok_or_else(|| "Development wasm binary not available".to_string())?;

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
#[cfg(test)]
use sp_api::{runtime_decl_for_Core::Core};
#[cfg(test)]
use sp_core::Encode;
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

		let genesis_hash = hex::decode("8fda83852a8834b91247d520f0fccde46af1c7cd298ad3d3e072f2c1265a44ae").expect("Decoding failed");

		let genesis_hash = siip_node_runtime::Hash::from_slice(&genesis_hash[..]);

		let genesis_hash = siip_node_runtime::test_block_hash(0);

		println!("{}", genesis_hash);
		// for i in 0..32 {
		// 	bytes[i] = genesis_hash[i];
		// }

		// let genesis_hash = bytes;
		// let genesis_hash: siip_node_runtime::Hash = [6e174167eb21b5985c84441386028c5393ba0129103fbd471d01424f81ec0465];


		let b = siip_node_runtime::test_construct_block(1, genesis_hash, vec![extrinsic]);
	

		println!("GOT HERE");
		siip_node_runtime::Runtime::execute_block(b);
		// assert_err!(siip_node_runtime::Runtime::apply_extrinsic(extrinsic), "bla");
	});
}

#[test]
fn transaction_fee_subtracted() {
	new_test_ext().execute_with(|| {
		let register = siip_node_runtime::pallet_siip::Call::register_certificate(
			"Sam".chars().map(|c| c as u8).collect(),
			"abc.com".chars().map(|c| c as u8).collect(),
			"127.0.0.1".chars().map(|c| c as u8).collect(),
			"{}".chars().map(|c| c as u8).collect(),
			"abcdef".chars().map(|c| c as u8).collect()
		);

	
		// let alice_bal = siip_node_runtime::pallet_balances::Module::<siip_node_runtime::Runtime>::free_balance(get_account_id_from_seed::<sr25519::Public>("Alice"));
		// println!("Alice has {:?}", alice_bal);

		print_balances("Alice");

		let r = siip_node_runtime::Call::SiipModule(register);
		let extras = siip_node_runtime::default_extras(0);
		let signed = sign("Alice", &r, &extras);

		let extrinsic = siip_node_runtime::UncheckedExtrinsic {
			function: r.clone(),
			signature: Some((
				siip_node_runtime::Address::Id(get_account_id_from_seed::<sr25519::Public>("Alice")),
				signed,
				extras
			))
		};


		let genesis_hash = hex::decode("8fda83852a8834b91247d520f0fccde46af1c7cd298ad3d3e072f2c1265a44ae").expect("Decoding failed");

		let genesis_hash = siip_node_runtime::Hash::from_slice(&genesis_hash[..]);

		let genesis_hash = siip_node_runtime::test_block_hash(0);

		println!("{}", genesis_hash);
		// for i in 0..32 {
		// 	bytes[i] = genesis_hash[i];
		// }

		// let genesis_hash = bytes;
		// let genesis_hash: siip_node_runtime::Hash = [6e174167eb21b5985c84441386028c5393ba0129103fbd471d01424f81ec0465];

		println!("{:?}", siip_node_runtime::Executive::validate_transaction(sp_transaction_pool::TransactionSource::InBlock, extrinsic.clone()));
		let b = siip_node_runtime::test_construct_block(1, genesis_hash, vec![extrinsic]);
	
		print_balances("Alice");

		println!("GOT HERE");
		// siip_node_runtime::Runtime::execute_block(b);
		// assert_err!(siip_node_runtime::Runtime::apply_extrinsic(extrinsic), "bla");
	});
}

fn print_balances(name: &str) {
	let free_balance = siip_node_runtime::pallet_balances::Module::<siip_node_runtime::Runtime>::free_balance(get_account_id_from_seed::<sr25519::Public>(name)) / 1_000_000_000_000u128;
	println!("{} has {:?} free", name, free_balance);
	let reserved_balance = siip_node_runtime::pallet_balances::Module::<siip_node_runtime::Runtime>::reserved_balance(get_account_id_from_seed::<sr25519::Public>(name)) / 1_000_000_000_000u128;
	println!("{} has {:?} reserved", name, reserved_balance);
}

pub fn sign(name: &str, function: &siip_node_runtime::Call, extras: &siip_node_runtime::SignedExtra ) -> siip_node_runtime::Signature {
	use sp_core::Encode;
	let raw_payload = siip_node_runtime::SignedPayload::new(function.clone(), extras.clone()).unwrap();
	// let sig= sr25519::Pair::from_string(&format!("//{}", name), None)
	// 	.expect("static values are valid; qed").sign(&raw_payload.encode()[..]);
	let sig = raw_payload.using_encoded(|p| sr25519::Pair::from_string(&format!("//{}", name), None)
	.expect("static values are valid; qed").sign(p));

	let signature = siip_node_runtime::Signature::Sr25519(sig);
	// println!("{:?}", signature.verify(&raw_payload.encode()[..], &get_account_id_from_seed::<sr25519::Public>("Alice")));
	signature
}
