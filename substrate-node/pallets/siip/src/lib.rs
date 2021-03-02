#![cfg_attr(not(feature = "std"), no_std)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// https://substrate.dev/docs/en/knowledgebase/runtime/frame

use frame_support::{decl_module, decl_storage, decl_event, decl_error, ensure, dispatch, traits::Get};
use frame_support::codec::{Encode, Decode};
use frame_system::ensure_signed;
use sp_std::prelude::*;
use core::str::from_utf8;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

/// Configure the pallet by specifying the parameters and types on which it depends.
pub trait Trait: frame_system::Trait {
	/// Because this pallet emits events, it depends on the runtime's definition of an event.
	type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;
}

type String = Vec<u8>;
pub const CERTIFICATE_VERSION: i32 = 1;

#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Certificate<AccountIdT> {
	version_number: i32,
	owner_id: AccountIdT,
	owner_name: String,
	public_key_info: String,
	public_key: String,
	ip_addr: String,
	domain_name: String,
}

// The pallet's runtime storage items.
// https://substrate.dev/docs/en/knowledgebase/runtime/storage
decl_storage! {
	// A unique name is used to ensure that the pallet's storage items are isolated.
	// This name may be updated, but each pallet in the runtime must use a unique name.
	// ---------------------------------
	trait Store for Module<T: Trait> as SiipModule {
		// Learn more about declaring storage items:
		// https://substrate.dev/docs/en/knowledgebase/runtime/storage#declaring-storage-items
		Something get(fn something): Option<u32>;
		pub CertificateMap get(fn get_certificate): map hasher(blake2_128_concat) String => Certificate<T::AccountId>;
	}
}

// Pallets use events to inform users when important changes are made.
// https://substrate.dev/docs/en/knowledgebase/runtime/events
decl_event!(
	pub enum Event<T> where AccountId = <T as frame_system::Trait>::AccountId {
		/// Event documentation should end with an array that provides descriptive names for event
		/// parameters. [something, who]
		SomethingStored(u32, AccountId),

		/// This is some documentation I guess. [certificate, person]
		DomainRegistered(Certificate<AccountId>, AccountId),
	}
);

// Errors inform users that something went wrong.
decl_error! {
	pub enum Error for Module<T: Trait> {
		DomainAlreadyTaken,
		InvalidOwnerString,
		InvalidDomain,
	}
}

// Dispatchable functions allows users to interact with the pallet and invoke state changes.
// These functions materialize as "extrinsics", which are often compared to transactions.
// Dispatchable functions must be an notated with a weight and must return a DispatchResult.
decl_module! {
	pub struct Module<T: Trait> for enum Call where origin: T::Origin {
		// Errors must be initialized if they are used by the pallet.
		type Error = Error<T>;

		// Events must be initialized if they are used by the pallet.
		fn deposit_event() = default;

		/// An example dispatchable that takes a singles value as a parameter, writes the value to
		/// storage and emits an event. This function must be dispatched by a signed extrinsic.
		#[weight = 10_000 + T::DbWeight::get().writes(1)]
		pub fn do_something(origin, something: u32) -> dispatch::DispatchResult {
			// Check that the extrinsic was signed and get the signer.
			// This function will return an error if the extrinsic is not signed.
			// https://substrate.dev/docs/en/knowledgebase/runtime/origin
			let who = ensure_signed(origin)?;

			// Update storage.
			Something::put(something);

			// Emit an event.
			Self::deposit_event(RawEvent::SomethingStored(something, who));
			// Return a successful DispatchResult
			Ok(())
		}

		#[weight = 100_000 + T::DbWeight::get().writes(1) + T::DbWeight::get().reads(1)]
		pub fn register_certificate(
			origin,
			owner_name: String,
			domain_name: String,
			ip_addr: String,
			public_key_info: String,
			public_key: String
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;

			//Ensures that the domain is available
			ensure!(!CertificateMap::<T>::contains_key(&domain_name), Error::<T>::DomainAlreadyTaken);

			//Ensures that the owner_name and domain name are valid UTF-8 string
			ensure!(from_utf8(&owner_name).is_ok(), Error::<T>::InvalidOwnerString);
			ensure!(from_utf8(&domain_name).is_ok(), Error::<T>::InvalidDomain);

			//Ensures that the domain name is valid
			const DOMAIN_MAX_CHARS: usize = 64;
			ensure!(from_utf8(&domain_name).unwrap().chars().count() < DOMAIN_MAX_CHARS,
					Error::<T>::InvalidDomain);

			let invalid_chars = vec!['-', ' ', '!', '@', '#', '$', '^', '&', '*', '(', ')'];
			for char in invalid_chars {
				ensure!(from_utf8(&domain_name).unwrap().matches(char).count() == 0, Error::<T>::InvalidDomain);
			}

			//Replace uppercase letters with lowercase ones
			let domain_name = from_utf8(&domain_name).unwrap().to_lowercase().as_bytes().to_vec();

			let cert = Certificate {
				version_number: CERTIFICATE_VERSION,
				owner_id: sender.clone(),
				owner_name: owner_name.clone(),
				public_key_info: public_key_info.clone(),
				public_key: public_key.clone(),
				ip_addr: ip_addr.clone(),
				domain_name: domain_name.clone(),
			};

			CertificateMap::<T>::insert(&domain_name, cert.clone());

			Self::deposit_event(RawEvent::DomainRegistered(cert, sender));
			Ok(())
		}
	}
}
