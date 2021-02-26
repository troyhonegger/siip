
use std::{sync::Arc, time::Duration};
use std::thread;
use parking_lot::Mutex;
use log::{info, warn};
use sp_api::{BlockT, ProvideRuntimeApi};
use sp_core::H256;
use sp_runtime::generic::BlockId;
use sc_consensus_pow::MiningWorker;

use sha3pow;

pub fn do_mining<Block, Algorithm, C>(
    worker_data: Arc<Mutex<MiningWorker<Block, Algorithm, C>>>,
    algorithm: Algorithm
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
    }
}
