use parity_scale_codec::{Decode, Encode};
use rand::{SeedableRng, prelude::SmallRng, thread_rng};
use sc_consensus_pow::{Error, PowAlgorithm};
use sha3::{Digest, Sha3_256};
use sp_api::ProvideRuntimeApi;
use sp_consensus_pow::{DifficultyApi, Seal as RawSeal};
use sp_core::{H256, U256};
use sp_runtime::generic::BlockId;
use sp_runtime::traits::Block as BlockT;
use std::sync::Arc;

/// Determine whether the given hash satisfies the given difficulty.
/// The test is done by multiplying the two together. If the product
/// overflows the bounds of U256, then the product (and thus the hash)
/// was too high.
fn hash_meets_difficulty(hash: &H256, difficulty: U256) -> bool {
	let num_hash = U256::from(&hash[..]);
	let (_, overflowed) = num_hash.overflowing_mul(difficulty);

	!overflowed
}

/// A Seal struct that will be encoded to a Vec<u8> as used as the
/// `RawSeal` type.
#[derive(Clone, PartialEq, Eq, Encode, Decode, Debug)]
pub struct Seal {
	pub difficulty: U256,
	pub work: H256,
	pub nonce: H256,
}

/// A not-yet-computed attempt to solve the proof of work. Calling the
/// compute method will compute the hash and return the seal.
#[derive(Clone, PartialEq, Eq, Encode, Decode, Debug)]
pub struct Compute {
	pub difficulty: U256,
	pub pre_hash: H256,
	pub nonce: H256,
}

impl Compute {
	pub fn compute(self) -> Seal {
		let work = H256::from_slice(Sha3_256::digest(&self.encode()[..]).as_slice());

		Seal {
			nonce: self.nonce,
			difficulty: self.difficulty,
			work,
		}
	}
}

/// A minimal PoW algorithm that uses Sha3 hashing.
/// Difficulty is fixed at 1_000_000
#[derive(Clone)]
pub struct MinimalSha3Algorithm;

// Here we implement the general PowAlgorithm trait for our concrete Sha3Algorithm
impl<B: BlockT<Hash = H256>> PowAlgorithm<B> for MinimalSha3Algorithm {
	type Difficulty = U256;

	fn difficulty(&self, _parent: B::Hash) -> Result<Self::Difficulty, Error<B>> {
		// Fixed difficulty hardcoded here
		Ok(U256::from(1_000_000))
	}

	fn verify(
		&self,
		_parent: &BlockId<B>,
		pre_hash: &H256,
		_pre_digest: Option<&[u8]>,
		seal: &RawSeal,
		difficulty: Self::Difficulty,
	) -> Result<bool, Error<B>> {
		// Try to construct a seal object by decoding the raw seal given
		let seal = match Seal::decode(&mut &seal[..]) {
			Ok(seal) => seal,
			Err(_) => return Ok(false),
		};

		// See whether the hash meets the difficulty requirement. If not, fail fast.
		if !hash_meets_difficulty(&seal.work, difficulty) {
			return Ok(false);
		}

		// Make sure the provided work actually comes from the correct pre_hash
		let compute = Compute {
			difficulty,
			pre_hash: *pre_hash,
			nonce: seal.nonce,
		};

		if compute.compute() != seal {
			return Ok(false);
		}

		Ok(true)
	}
}

/// A complete PoW Algorithm that uses Sha3 hashing.
/// Needs a reference to the client so it can grab the difficulty from the runtime.
pub struct Sha3Algorithm<C> {
	client: Arc<C>,
}

impl<C> Sha3Algorithm<C> {
	pub fn new(client: Arc<C>) -> Self {
		Self { client }
	}
}

// Manually implement clone. Deriving doesn't work because
// it'll derive impl<C: Clone> Clone for Sha3Algorithm<C>. But C in practice isn't Clone.
impl<C> Clone for Sha3Algorithm<C> {
	fn clone(&self) -> Self {
		Self::new(self.client.clone())
	}
}

// Here we implement the general PowAlgorithm trait for our concrete Sha3Algorithm
impl<B: BlockT<Hash = H256>, C> PowAlgorithm<B> for Sha3Algorithm<C>
where
	C: ProvideRuntimeApi<B>,
	C::Api: DifficultyApi<B, U256>,
{
	type Difficulty = U256;

	fn difficulty(&self, parent: B::Hash) -> Result<Self::Difficulty, Error<B>> {
		let parent_id = BlockId::<B>::hash(parent);
		self.client
			.runtime_api()
			.difficulty(&parent_id)
			.map_err(|err| {
				sc_consensus_pow::Error::Environment(
					format!("Fetching difficulty from runtime failed: {:?}", err)
				)
			})
	}

	fn verify(
		&self,
		_parent: &BlockId<B>,
		pre_hash: &H256,
		_pre_digest: Option<&[u8]>,
		seal: &RawSeal,
		difficulty: Self::Difficulty,
	) -> Result<bool, Error<B>> {
		// Try to construct a seal object by decoding the raw seal given
		let seal = match Seal::decode(&mut &seal[..]) {
			Ok(seal) => seal,
			Err(_) => return Ok(false),
		};

		// See whether the hash meets the difficulty requirement. If not, fail fast.
		if !hash_meets_difficulty(&seal.work, difficulty) {
			return Ok(false);
		}

		// Make sure the provided work actually comes from the correct pre_hash
		let compute = Compute {
			difficulty,
			pre_hash: *pre_hash,
			nonce: seal.nonce,
		};

		if compute.compute() != seal {
			return Ok(false);
		}

		Ok(true)
	}
}

pub trait SiipPowAlgorithm<B> : PowAlgorithm<B>
	where B: BlockT<Hash=H256>,
		Self: PowAlgorithm<B, Difficulty=U256>
{
	fn mine(
		&self,
		_parent: &BlockId<B>, // parent block hash is included in block header which is used to compute pre_hash, so we don't need it here
		pre_hash: &<B as BlockT>::Hash,
		_pre_digest: Option<&[u8]>, //TODO need to use this to compute the seal as well, so it can encode the block author
		difficulty: <Self as PowAlgorithm<B>>::Difficulty,
		round: u32 // The number of nonces to try during this call
	) -> Result<Option<RawSeal>, Error<B>> {
		// Get a randomness source from the environment; fail if one isn't available
		let mut rng = SmallRng::from_rng(&mut thread_rng())
			.map_err(|e| Error::Environment(format!("Initialize RNG failed for mining: {:?}", e)))?;
	
		// Loop the specified number of times
		for _ in 0..round {
	
			// Choose a new nonce
			let nonce = H256::random_using(&mut rng);
	
			// Calculate the seal
			let compute = Compute {
				difficulty,
				pre_hash: *pre_hash,
				nonce,
			};
			let seal = compute.compute();
	
			// If we solved the PoW then return, otherwise loop again
			if hash_meets_difficulty(&seal.work, difficulty) {
				return Ok(Some(seal.encode()))
			}
		}
	
		// Tried the specified number of rounds and never found a solution
		Ok(None)
	}
}

impl<B: BlockT<Hash=H256>> SiipPowAlgorithm<B> for MinimalSha3Algorithm {}

// TODO Sha3Algorithm should implement SiipPowAlgorithm as well, so it can be configured in services.rs
// as a drop-in replacement for MinimalSha3Algorithm, allowing for dynamic difficulty selection.
// This line of code doesn't quite compile, but it's close

//impl<B: BlockT<Hash=H256>, C: ProvideRuntimeApi<B>> SiipPowAlgorithm<B> for Sha3Algorithm<C> {}
