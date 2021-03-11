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
use siip_node_runtime::Runtime;
use siip_node_runtime::pallet_siip::Module as SiipModule;
use sp_core::sr25519;

#[rpc]
pub trait SiipRpcTrait {
    #[rpc(name = "add_cert", returns = "String")]
    fn add_cert(&self, name: String, ip: String, pubkey: String) -> SystemResult<String>;
}

pub struct SiipRpcStruct<C> {
    client: Arc<C>
}

impl<C> SiipRpcStruct<C> {
    pub fn new(client: Arc<C>) -> Self {
        SiipRpcStruct {
            client
        }
    }
}

impl<C> SiipRpcTrait for SiipRpcStruct<C> where C: Send + Sync + 'static {
    fn add_cert(&self, domain: String, ip: String, pubkey: String) -> SystemResult<String> {
        let res = SiipModule::<Runtime>::register_certificate(
            siip_node_runtime::Origin::signed(
                crate::chain_spec::get_account_id_from_seed::<sr25519::Public>("Alice")
            ),
            "Genesis".as_bytes().to_vec(),
            domain.as_bytes().to_vec(),
            ip.as_bytes().to_vec(),
            "{}".as_bytes().to_vec(),
            pubkey.as_bytes().to_vec()
        );

        let msg = match res {
            Ok(()) => domain,
            Err(dispatch) => "uh oh".to_string(),
        };

        Ok(msg)
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
