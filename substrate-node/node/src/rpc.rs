//! A collection of node-specific RPC methods.
//! Substrate provides the `sc-rpc` crate, which defines the core RPC layer
//! used by Substrate nodes. This file extends those RPC definitions with
//! capabilities that are specific to this project's runtime configuration.

#![warn(missing_docs)]

use std::sync::Arc;

use siip_node_runtime::{opaque::Block, AccountId, Balance, Index};
use sp_api::ProvideRuntimeApi;
use sp_blockchain::{Error as BlockChainError, HeaderMetadata, HeaderBackend};
use sp_block_builder::BlockBuilder;
pub use sc_rpc_api::DenyUnsafe;
use sp_transaction_pool::TransactionPool;
use jsonrpc_derive::rpc;
use sc_rpc_api::system::error::Result as SystemResult;
use core::str::from_utf8;
use siip_node_runtime::pallet_siip::{check_name, check_domain, check_ip, check_info, check_key, check_email};

#[rpc]
/// RPCs related to the Siip Pallet
pub trait SiipRpcTrait {
	#[rpc(name = "validate_name", returns = "String")]
	/// Validates the name provided.
	/// Returns multiple lines. Each line will contain Ok: message, or Err: message
	fn validate_name(&self, name: String) -> SystemResult<String>;

	#[rpc(name = "validate_domain", returns = "String")]
	/// Validates the domain provided.
	/// Returns multiple lines. Each line will contain Ok: message, or Err: message
	fn validate_domain(&self, domain: String) -> SystemResult<String>;

	#[rpc(name = "validate_ip", returns = "String")]
	/// Validates the IPv4 address provided.
	/// Returns multiple lines. Each line will contain Ok: message, or Err: message
	fn validate_ip(&self, domain: String) -> SystemResult<String>;

	#[rpc(name = "validate_info", returns = "String")]
	/// Validates the json info provided.
	/// Returns multiple lines. Each line will contain Ok: message, or Err: message
	fn validate_info(&self, info: String) -> SystemResult<String>;

	#[rpc(name = "validate_key", returns = "String")]
	/// Validates the public key provided.
	/// Returns multiple lines. Each line will contain Ok: message, or Err: message
	fn validate_key(&self, key: String) -> SystemResult<String>;

	#[rpc(name = "validate_email", returns = "String")]
    	/// Validates the email provided.
    	/// Returns multiple lines. Each line will contain Ok: message, or Err: message
    	fn validate_email(&self, email: String) -> SystemResult<String>;

}

/// A completely useless struct
pub struct SiipRpcStruct<C> {
    client: Arc<C>
}

/// No idea what this does
impl<C> SiipRpcStruct<C> {
	/// What does this do?
    pub fn new(client: Arc<C>) -> Self {
        SiipRpcStruct {
            client
        }
    }
}

impl<C> SiipRpcTrait for SiipRpcStruct<C> where C: Send + Sync + 'static {
	//Contains 'Err:' if invalid
	fn validate_name(&self, name: String) -> SystemResult<String> {
		let criteria = check_name(&name.into_bytes());
		Ok(from_utf8(&criteria).unwrap().into())
	}
	fn validate_domain(&self, domain: String) -> SystemResult<String> {
		let criteria = check_domain(&domain.into_bytes());
		Ok(from_utf8(&criteria).unwrap().into())
	}
	fn validate_ip(&self, ip: String) -> SystemResult<String> {
		let criteria = check_ip(&ip.into_bytes());
		Ok(from_utf8(&criteria).unwrap().into())
	}
	fn validate_info(&self, info: String) -> SystemResult<String> {
		let criteria = check_info(&info.into_bytes());
		Ok(from_utf8(&criteria).unwrap().into())
	}
	fn validate_key(&self, key: String) -> SystemResult<String> {
		let criteria = check_key(&key.into_bytes());
		Ok(from_utf8(&criteria).unwrap().into())
	}
	fn validate_email(&self, email: String) -> SystemResult<String> {
    		let criteria = check_email(&email.into_bytes());
    		Ok(from_utf8(&criteria).unwrap().into())
    	}
}

/// Full client dependencies.
pub struct FullDeps<C, P> {
	/// The client instance to use.
	pub client: Arc<C>,
	/// Transaction pool instance.
	pub pool: Arc<P>,
	/// Whether to deny unsafe calls
	pub deny_unsafe: DenyUnsafe,
}

/// Instantiate all full RPC extensions.
pub fn create_full<C, P>(
	deps: FullDeps<C, P>,
) -> jsonrpc_core::IoHandler<sc_rpc::Metadata> where
	C: ProvideRuntimeApi<Block>,
	C: HeaderBackend<Block> + HeaderMetadata<Block, Error=BlockChainError> + 'static,
	C: Send + Sync + 'static,
	C::Api: substrate_frame_rpc_system::AccountNonceApi<Block, AccountId, Index>,
	C::Api: pallet_transaction_payment_rpc::TransactionPaymentRuntimeApi<Block, Balance>,
	C::Api: BlockBuilder<Block>,
	P: TransactionPool + 'static,
{
	use substrate_frame_rpc_system::{FullSystem, SystemApi};
	use pallet_transaction_payment_rpc::{TransactionPayment, TransactionPaymentApi};

	let mut io = jsonrpc_core::IoHandler::default();
	let FullDeps {
		client,
		pool,
		deny_unsafe,
	} = deps;

	io.extend_with(
		SystemApi::to_delegate(FullSystem::new(client.clone(), pool, deny_unsafe))
	);

	io.extend_with(
		TransactionPaymentApi::to_delegate(TransactionPayment::new(client.clone()))
	);

    io.extend_with(
        SiipRpcTrait::to_delegate(SiipRpcStruct::new(client.clone()))
    );

	// Extend this RPC with a custom API by using the following syntax.
	// `YourRpcStruct` should have a reference to a client, which is needed
	// to call into the runtime.
	// `io.extend_with(YourRpcTrait::to_delegate(YourRpcStruct::new(ReferenceToClient, ...)));`

	io
}
