use frame_support::{codec::Decode, traits::OnUnbalanced};
use frame_support::traits::Currency;
use sp_consensus_pow::POW_ENGINE_ID;


pub fn get_block_miner<T: frame_system::Config>() -> Option<T::AccountId> {
	frame_system::Module::<T>::digest()
		.logs
		.iter()
		.filter_map(|s| s.as_pre_runtime())
		.filter_map(|(id, mut data)| if id == POW_ENGINE_ID {
			T::AccountId::decode(&mut data).ok()
		} else {
			None
		})
		.next()
}

pub struct RewardMiner<T: frame_system::Config, C: Currency<T::AccountId>>(sp_std::marker::PhantomData<(T,C)>);

impl<T, C> OnUnbalanced<C::NegativeImbalance> for RewardMiner<T, C>
	where T: pallet_transaction_payment::Config,
		C: Currency<T::AccountId> {

	fn on_nonzero_unbalanced(amount: C::NegativeImbalance) {
		if let Some(author) = get_block_miner::<T>() {
			C::resolve_creating(&author, amount);
		}
	}
}
