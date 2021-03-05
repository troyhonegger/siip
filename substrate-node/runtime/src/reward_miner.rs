use frame_support::codec::{Encode, Decode};
use frame_support::traits::Currency;
use frame_support::weights::{DispatchInfo, PostDispatchInfo};
use sp_runtime::{DispatchResult, FixedPointOperand};
use sp_runtime::traits::{Dispatchable, DispatchInfoOf, PostDispatchInfoOf, SignedExtension, Zero};
use sp_runtime::transaction_validity::TransactionValidityError;
use sp_std::convert::TryInto;
use sp_consensus_pow::POW_ENGINE_ID;


pub fn get_block_miner<T: frame_system::Trait>() -> Option<T::AccountId> {
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


// useful type to have around. Copied from pallet-transaction-payment
type BalanceOf<T> =
	<<T as pallet_transaction_payment::Trait>::Currency as Currency<<T as frame_system::Trait>::AccountId>>::Balance;

#[derive(Encode, Decode, Clone, Eq, PartialEq)]
pub struct RewardMiner<T>
	where
		T: pallet_transaction_payment::Trait + Send + Sync,
		T::Call: Dispatchable<Info=DispatchInfo, PostInfo=PostDispatchInfo>,
		BalanceOf<T>: Send + Sync + FixedPointOperand, {
	phantom: sp_std::marker::PhantomData<T>
}

impl<T> sp_std::fmt::Debug for RewardMiner<T>
	where
		T: pallet_transaction_payment::Trait + Send + Sync,
		T::Call: Dispatchable<Info=DispatchInfo, PostInfo=PostDispatchInfo>,
		BalanceOf<T>: Send + Sync + FixedPointOperand, {
	#[cfg(feature = "std")]
	fn fmt(&self, f: &mut sp_std::fmt::Formatter) -> sp_std::fmt::Result {
		write!(f, "RewardMiner")
	}
	#[cfg(not(feature = "std"))]
	fn fmt(&self, _: &mut sp_std::fmt::Formatter) -> sp_std::fmt::Result {
		Ok(())
	}
}

impl<T> SignedExtension for RewardMiner<T>
	where
		T: pallet_transaction_payment::Trait + Send + Sync,
		T::Call: Dispatchable<Info=DispatchInfo, PostInfo=PostDispatchInfo>,
		BalanceOf<T>: Send + Sync + FixedPointOperand, {
    const IDENTIFIER: &'static str = "RewardMiner";

    type AccountId = T::AccountId;
    type Call = T::Call;
	type AdditionalSigned = ();

    type Pre = ();

    fn additional_signed(&self) -> Result<Self::AdditionalSigned, frame_support::unsigned::TransactionValidityError> {
        Ok(())
	}

	fn post_dispatch(
		_pre: Self::Pre,
		info: &DispatchInfoOf<Self::Call>,
		post_info: &PostDispatchInfoOf<Self::Call>,
		len: usize,
		_result: &DispatchResult,
	) -> Result<(), TransactionValidityError> {
		let author = get_block_miner::<T>();
		if let Some(author) = author {
			let fee = pallet_transaction_payment::Module::<T>::compute_actual_fee(
				len.try_into().unwrap(), // TOOD panic in unwrap() - not acceptable
				&info,
				&post_info,
				BalanceOf::<T>::zero() // transaction tip - currently assuming zero
			);
			if !fee.is_zero() {
				<T as pallet_transaction_payment::Trait>::Currency::deposit_creating(&author, fee);
			}
		}
		Ok(())
	}
}
