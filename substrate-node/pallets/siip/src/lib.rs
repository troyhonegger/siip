#![cfg_attr(not(feature = "std"), no_std)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// https://substrate.dev/docs/en/knowledgebase/runtime/frame

use frame_support::{decl_module, decl_storage, decl_event, decl_error, ensure, dispatch};
use frame_support::codec::{Encode, Decode};
use frame_system::ensure_signed;
use sp_std::prelude::*;
use core::str::from_utf8;
use serde_json;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

/// Configure the pallet by specifying the parameters and types on which it depends.
pub trait Trait: frame_system::Trait {
	/// Because this pallet emits events, it depends on the runtime's definition of an event.
	type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;
}

pub const CERTIFICATE_VERSION: i32 = 1;

#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Certificate<AccountIdT> {
	version_number: i32,
	owner_id: AccountIdT,
	name: Vec<u8>,
	info: Vec<u8>,
	key: Vec<u8>,
	ip_addr: Vec<u8>,
	domain: Vec<u8>,
}

fn check_name(name: Vec<u8>) -> Option<Vec<u8>> {
	//Must be a valid UTF-8 String
	from_utf8(&name).ok()?;

	//I'm not willing to make further assumptions about people's names.
	//Read this link for more info:
	//https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/

	Some(name)
}

fn check_domain(domain: Vec<u8>) -> Option<Vec<u8>> {
	//Must be a valid UTF-8 String
	let domain: &str = from_utf8(&domain).ok()?;

	//Must be less than 64 characters long
	const DOMAIN_MAX_CHARS: usize = 64;
	if domain.chars().count() >= DOMAIN_MAX_CHARS {
		return None;
	}

	//Must not contain these symbols
	let invalid_chars = vec!['-', ' ', '!', '@', '#', '$', '^', '&', '*', '(', ')'];
	for char in invalid_chars {
		if domain.matches(char).count() != 0 {
			return None
		}
	}

	//Domains are not case sensitive
	let domain = domain.to_lowercase();

	//Convert to a vector of <u8>
	Some(domain.as_bytes().to_vec())
}

//Must be a valid IPv4 address. We will not support IPv6 as of yet.
//Must be in dotted-decimal notation
fn check_ip(ip: Vec<u8>) -> Option<Vec<u8>> {
	//Should still be a valid UTF-8 string
	let ip: &str = from_utf8(&ip).ok()?;

	//There must be 3 periods
	if ip.matches('.').count() != 3 {
		return None;
	}

	//There must be 4 parts
	let nums: Vec<&str> = ip.clone().split('.').collect();
	if nums.len() != 4 {
		return None;
	}

	//Each part must be a valid u8 integer
	for num in nums.into_iter() {
		let num: i32 = num.parse().ok()?;
		if (num < u8::MIN as i32) || (num > u8::MAX as i32) {
			return None;
		}
	}

	return Some(ip.as_bytes().to_vec());
}

//The info field must be formatted with json
fn check_info(info: Vec<u8>) -> Option<Vec<u8>> {
	let info = from_utf8(&info).ok()?;

	//Only checks for a valid json
	//Source: https://users.rust-lang.org/t/serde-json-checking-syntax-of-json-file/16265/3
	let _: serde_json::Value = serde_json::from_str(&info).ok()?;

	return Some(info.as_bytes().to_vec());
}

//Key must be in hexadecimal notation, converts it to uppercase
fn check_key(key: Vec<u8>) -> Option<Vec<u8>> {
	let key = from_utf8(&key).ok()?;

	//A vector containing the string (as bytes) without the ':' and '-' characters
	let mut new_key: Vec<u8> = Vec::new();

	//4 bytes is the max length of a UTF-8 character
	let mut buffer: [u8; 4] = [0; 4];

	//Parses the string and adds the non-{':', '-'} characters
	for char in key.chars() {
		match char {
			':' => (),
			'-' => (),
			_ => {
				new_key.extend_from_slice(char.encode_utf8(&mut buffer).as_bytes())
			}
		};
	}

	//Converts to upper case
	let key = from_utf8(&new_key).ok()?.to_uppercase().as_bytes().to_vec();

	//Ensure that the remaining key is hexadecimal
	for i in key.iter() {
		match i {
			b'0' => (),
			b'1' => (),
			b'2' => (),
			b'3' => (),
			b'4' => (),
			b'5' => (),
			b'6' => (),
			b'7' => (),
			b'8' => (),
			b'9' => (),
			b'A' => (),
			b'B' => (),
			b'C' => (),
			b'D' => (),
			b'E' => (),
			b'F' => (),
			_ => return None,
		};
	}

	//I won't get into what the minimum key size should be, but I will require a key
	if key.len() < 1 {
		return None;
	}

	//We know know that the key only consists of these characters.
	//So, each character occupies at most 1 character

	//Adds a colon after every 2 hexadecimal characters for readability
	let mut new_key: Vec<u8> = Vec::new();
	for i in 0..(key.len() / 2) {
		if i != 0 {
			new_key.push(':' as u8);
		}
		new_key.push(key[2 * i] as u8);
		new_key.push(key[2 * i + 1] as u8);
	}

	Some(new_key)
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
		pub CertificateMap get(fn get_certificate): map hasher(blake2_128_concat) Vec<u8> => Certificate<T::AccountId>;
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
		InvalidIP,
		InvalidInfo,
		InvalidKey,
		InvalidOwner,
		InvalidDomain,
		DomainAlreadyTaken,
		NonexistentDomain,
		DifferentOwner,
		NoModifications,

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
			name: Vec<u8>,
			domain: Vec<u8>,
			ip_addr: Vec<u8>,
			info: Vec<u8>,
			key: Vec<u8>
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;
			let name = check_name(name).ok_or_else(|| Error::<T>::InvalidOwner)?;
			let domain = check_domain(domain).ok_or_else(|| Error::<T>::InvalidDomain)?;
			let ip_addr = check_ip(ip_addr).ok_or_else(|| Error::<T>::InvalidIP)?;
			let info = check_info(info).ok_or_else(|| Error::<T>::InvalidInfo)?;
			let key = check_key(key).ok_or_else(|| Error::<T>::InvalidKey)?;

			//Ensures that the domain is available
			ensure!(!CertificateMap::<T>::contains_key(&domain), Error::<T>::DomainAlreadyTaken);

			let cert = Certificate {
				version_number: CERTIFICATE_VERSION,
				owner_id: sender.clone(),
				name: name.clone(),
				info: info.clone(),
				key: key.clone(),
				ip_addr: ip_addr.clone(),
				domain: domain.clone(),
			};

			CertificateMap::<T>::insert(&domain, cert.clone());

			Self::deposit_event(RawEvent::CertificateRegistered(cert, sender));
			Ok(())
		}

		#[weight = 1]
		pub fn modify_certificate(
			origin,
			name: Vec<u8>,
			domain: Vec<u8>,
			ip_addr: Vec<u8>,
			info: Vec<u8>,
			key: Vec<u8>
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;
			let name = check_name(name).ok_or_else(|| Error::<T>::InvalidOwner)?;
			let domain = check_domain(domain).ok_or_else(|| Error::<T>::InvalidDomain)?;
			let ip_addr = check_ip(ip_addr).ok_or_else(|| Error::<T>::InvalidIP)?;
			let info = check_info(info).ok_or_else(|| Error::<T>::InvalidInfo)?;
			let key = check_key(key).ok_or_else(|| Error::<T>::InvalidKey)?;

			//Ensures that the domain already exists
			ensure!(CertificateMap::<T>::contains_key(&domain), Error::<T>::NonexistentDomain);

			let cert = Certificate {
				version_number: CERTIFICATE_VERSION,
				owner_id: sender.clone(),
				name: name.clone(),
				info: info.clone(),
				key: key.clone(),
				ip_addr: ip_addr.clone(),
				domain: domain.clone(),
			};

			//Ensures that the owner of the domain is the sender
			let old_cert = CertificateMap::<T>::get(&domain);
			ensure!(sender == old_cert.owner_id, Error::<T>::DifferentOwner);

			//Ensures that there is some modification
			ensure!(cert != old_cert, Error::<T>::NoModifications);

			CertificateMap::<T>::take(&domain);
			CertificateMap::<T>::insert(&domain, cert.clone());

			Self::deposit_event(RawEvent::CertificateModified(cert, old_cert, sender));
			Ok(())
		}

		#[weight = 1]
		pub fn remove_certificate(
			origin,
			domain: Vec<u8>,
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;
			let domain = check_domain(domain).ok_or_else(|| Error::<T>::InvalidDomain)?;

			//Ensures that the domain already exists
			ensure!(CertificateMap::<T>::contains_key(&domain), Error::<T>::NonexistentDomain);

			//Ensures that the owner of the domain is the sender
			let old_cert = CertificateMap::<T>::get(&domain);
			ensure!(sender == old_cert.owner_id, Error::<T>::DifferentOwner);

			CertificateMap::<T>::take(&domain);

			Self::deposit_event(RawEvent::CertificateRemoved(old_cert, sender));
			Ok(())
		}
	}
}
