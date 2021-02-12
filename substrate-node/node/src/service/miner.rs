
use std::{sync::Arc, time::Duration};
use std::thread;
use parking_lot::Mutex;
use log::{debug, info, warn, error};
use sp_api::{BlockT, ProvideRuntimeApi};
use sp_core::{H256, U256};
use sp_runtime::generic::BlockId;
use sc_consensus_pow::{MiningWorker, PowAlgorithm};

use sha3pow;

pub fn do_mining<Block, Algorithm, C>(
    worker_data: Arc<Mutex<MiningWorker<Block, Algorithm, C>>>,
    algorithm: Algorithm //TODO will need to think about ownership as soon as this is no longer a unit struct
) -> ()
where
    Block: BlockT<Hash=H256>,
    Algorithm: sha3pow::SiipPowAlgorithm<Block>,
    C: ProvideRuntimeApi<Block>,
    Algorithm::Difficulty: 'static,
{
    info!("⛏️  Started miner thread");
    loop {
        let mut block_ready = false;

        {
            let mut worker_data = worker_data.lock();
            if let Some(metadata) = worker_data.metadata() {
                block_ready = true;
                match algorithm.mine(
                        &BlockId::hash(metadata.best_hash),
                        &metadata.pre_hash,
                        metadata.pre_runtime.as_ref().map(|v| &v[..]),
                        metadata.difficulty,
                        1000/*rounds before giving up*/) {
                    Ok(r) => {
                        if let Some(seal) = r {
                            // Successfully mined block! Now submit it to the chain so it can be imported
                            info!("💰  Successfully mined block!"); //TODO remove this log - submit() will do it for you
                            worker_data.submit(seal);
                        }
                    },
                    Err(e) => {
                        warn!("Error mining block: {}", e);
                    }
                };
            }
        }
        
        if !block_ready {
            // no mining build ready - just be patient
            thread::sleep(Duration::from_millis(100));
        }

        // TODO the docs mention that mutex unlocking is not fair by default
        // i.e. when one thread repeatedly requests the mutex, it may starve other threads
        // in an effort to avoid the overhead of a context switch. This may become a problem later
    }
}
