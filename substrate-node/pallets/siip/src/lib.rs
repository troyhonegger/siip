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
		pub CertificateMap get(fn get_certificate): map hasher(blake2_128_concat) String => Certificate<T::AccountId>;
	}
}

// Pallets use events to inform users when important changes are made.
// https://substrate.dev/docs/en/knowledgebase/runtime/events
decl_event!(
	pub enum Event<T> where AccountId = <T as frame_system::Trait>::AccountId {
		/// A certificate was added to the blockchain. Returns: [certificate, person]
		CertificateRegistered(Certificate<AccountId>, AccountId),
		/// A certificate in the blockchain was modified. Returns: [certificate, certificate, person]
		CertificateModified(Certificate<AccountId>, Certificate<AccountId>, AccountId),
		/// A certificate in the blockchain was removed. Returns (deleted): [certificate, person]
		CertificateRemoved(Certificate<AccountId>, AccountId),
	}
);

// Errors inform users that something went wrong.
decl_error! {
	pub enum Error for Module<T: Trait> {
		DomainAlreadyTaken,
		InvalidOwnerString,
		InvalidDomain,
		NonexistentDomain,
		DifferentOwner,
		NoModifications
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

		#[weight = 1]
		pub fn register_certificate(
			origin,
			owner_name: String,
			domain_name: String,
			ip_addr: String,
			public_key_info: String,
			public_key: String
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;

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

			//Ensures that the domain is available
			ensure!(!CertificateMap::<T>::contains_key(&domain_name), Error::<T>::DomainAlreadyTaken);

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

			Self::deposit_event(RawEvent::CertificateRegistered(cert, sender));
			Ok(())
		}

		#[weight = 1]
		pub fn modify_certificate(
			origin,
			owner_name: String,
			domain_name: String,
			ip_addr: String,
			public_key_info: String,
			public_key: String
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;

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

			//Ensures that the domain already exists
			ensure!(CertificateMap::<T>::contains_key(&domain_name), Error::<T>::NonexistentDomain);

			let cert = Certificate {
				version_number: CERTIFICATE_VERSION,
				owner_id: sender.clone(),
				owner_name: owner_name.clone(),
				public_key_info: public_key_info.clone(),
				public_key: public_key.clone(),
				ip_addr: ip_addr.clone(),
				domain_name: domain_name.clone(),
			};

			//Ensures that the owner of the domain is the sender
			let old_cert = CertificateMap::<T>::get(&domain_name);
			ensure!(sender == old_cert.owner_id, Error::<T>::DifferentOwner);

			//Ensures that there is some modification
			ensure!(cert != old_cert, Error::<T>::NoModifications);

			CertificateMap::<T>::take(&domain_name);
			CertificateMap::<T>::insert(&domain_name, cert.clone());

			Self::deposit_event(RawEvent::CertificateModified(cert, old_cert, sender));
			Ok(())
		}

		#[weight = 1]
		pub fn remove_certificate(
			origin,
			domain_name: String,
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;

			//Ensures that the owner_name and domain name are valid UTF-8 string
			ensure!(from_utf8(&domain_name).is_ok(), Error::<T>::InvalidDomain);

			//Replace uppercase letters with lowercase ones
			let domain_name = from_utf8(&domain_name).unwrap().to_lowercase().as_bytes().to_vec();

			//Ensures that the domain already exists
			ensure!(CertificateMap::<T>::contains_key(&domain_name), Error::<T>::NonexistentDomain);

			//Ensures that the owner of the domain is the sender
			let old_cert = CertificateMap::<T>::get(&domain_name);
			ensure!(sender == old_cert.owner_id, Error::<T>::DifferentOwner);

			CertificateMap::<T>::take(&domain_name);

			Self::deposit_event(RawEvent::CertificateRemoved(old_cert, sender));
			Ok(())
		}
	}
}
