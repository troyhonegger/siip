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
pub trait Config: frame_system::Config {
	/// Because this pallet emits events, it depends on the runtime's definition of an event.
	type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;
	fn inflationary_reward();
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

pub fn check_name(name: &[u8]) -> Vec<u8> {
	let mut criteria: Vec<u8> = Vec::new();

	//Must be a valid UTF-8 String
	let name = from_utf8(name);
	match name {
		Ok(_val) => criteria.extend_from_slice("Ok: Must be a valid string\n".as_bytes()),
		Err(_err) => {
			criteria.extend_from_slice("Err: Must be a valid string\n".as_bytes());
			return criteria;
		},
	}
	let name = name.unwrap();

	//Must be at least 1 character long
	if name.len() >= 1 {
		criteria.extend_from_slice("Ok: Must be at least 1 character long\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Must be at least 1 character long\n".as_bytes());
	}

	//I'm not willing to make further assumptions about people's names.
	//Read this link for more info:
	//https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/

	criteria
}

pub fn check_domain(domain: &[u8]) -> Vec<u8> {
	let mut criteria: Vec<u8> = Vec::new();

	//Must be a valid UTF-8 String
	let domain = from_utf8(&domain);
	match domain {
		Ok(_val) => criteria.extend_from_slice("Ok: Must be a valid string\n".as_bytes()),
		Err(_err) => {
			criteria.extend_from_slice("Err: Must be a valid string\n".as_bytes());
			return criteria;
		},
	}
	let domain = domain.unwrap();

	//Must be less than 64 characters long
	const DOMAIN_MAX_CHARS: usize = 64;
	if domain.chars().count() < DOMAIN_MAX_CHARS {
		criteria.extend_from_slice("Ok: Must be shorter than 64 characters\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Must be shorter than 64 characters\n".as_bytes());
	}

	//Must not contain these symbols
	let invalid_chars = vec!['_', ' ', '!', '@', '#', '$', '^', '&', '*', '(', ')', '\n'];
	if domain.chars().all(|c| !invalid_chars.contains(&c)) {
		criteria.extend_from_slice("Ok: Must not contain the characters: '_', ' ', '!', '@',\
		'#', '$', '^', '&', '*', '(', ')', '\\n'\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Must not contain the characters: '_', ' ', '!', '@',\
		'#', '$', '^', '&', '*', '(', ')', '\\n'\n".as_bytes());
	}

	//Domains must be lowercase
	if domain.chars().all(|c| !c.is_uppercase()) {
		criteria.extend_from_slice("Ok: Characters may not be uppercase\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Characters may not be uppercase\n".as_bytes());
	}

	//The top level domain must be a 2-63 character long
	let parts: Vec<&str> = domain.split('.').collect();
	let tld = "";
	if (parts.len() < 2) || (!parts.last().is_some()) {
		criteria.extend_from_slice("Err: TLD must be between 2 and 63\
	 	characters in length\n".as_bytes());
	} else {
		let tld = parts.last().unwrap();
		if (tld.chars().count() < 2) || (tld.chars().count() > 63) {
			criteria.extend_from_slice("Err: TLD must be between 2 and 63\
	 		characters in length\n".as_bytes());
		} else {
			criteria.extend_from_slice("Ok: TLD must be between 2 and 63\
	 		characters in length\n".as_bytes());
		}
	}
	if (domain.chars().count() - tld.chars().count()) > 1 {
		criteria.extend_from_slice("Ok: Subdomain must be at least 1 character long\
			\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Subdomain must be at least 1 character long\
			\n".as_bytes());
	}


	criteria
}

//Must be a valid IPv4 address. We will not support IPv6 as of yet.
//Must be in dotted-decimal notation
pub fn check_ip(ip: &[u8]) -> Vec<u8> {
	let mut criteria: Vec<u8> = Vec::new();

	//Must be a valid UTF-8 String
	let ip = from_utf8(&ip);
	match ip {
		Ok(_val) => criteria.extend_from_slice("Ok: Must be a valid string\n".as_bytes()),
		Err(_err) => {
			criteria.extend_from_slice("Err: Must be a valid string\n".as_bytes());
			return criteria;
		},
	}
	let ip = ip.unwrap();

	//There must be 3 periods
	if ip.matches('.').count() == 3 {
		criteria.extend_from_slice("Ok: There must be three periods\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: There must be three periods\n".as_bytes());
	}

	//There must be 4 sections
	let nums: Vec<&str> = ip.clone().split('.').collect();
	if nums.iter().all(|str| str.len() >= 1) {
		criteria.extend_from_slice("Ok: There must be four sections (separated by periods)\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: There must be four sections (separated by periods)\n".as_bytes());
	}

	//Each section must be a valid U8 number
	if nums.into_iter().all(|str| str.parse::<u8>().is_ok()) {
		criteria.extend_from_slice("Ok: Numbers must be between 0 and 255\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Numbers must be between 0 and 255\n".as_bytes());
	}

	criteria
}

//The info field must be formatted with json
pub fn check_info(info: &[u8]) -> Vec<u8> {
	let mut criteria: Vec<u8> = Vec::new();

	//Must be a valid UTF-8 String
	let info = from_utf8(&info);
	match info {
		Ok(_val) => criteria.extend_from_slice("Ok: Must be a valid string\n".as_bytes()),
		Err(_err) => {
			criteria.extend_from_slice("Err: Must be a valid string\n".as_bytes());
			return criteria;
		},
	}
	let info = info.unwrap();

	//Only checks for a valid json
	//Source: https://users.rust-lang.org/t/serde-json-checking-syntax-of-json-file/16265/3
	//let _: serde_json::Value = serde_json::from_str(&info).ok()?;

	if serde_json::from_str::<serde_json::Value>(&info).is_ok() {
		criteria.extend_from_slice("Ok: Must be a valid json\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Must be a valid json\n".as_bytes());
	}

	criteria
}

//Key must be in hexadecimal notation, converts it to uppercase
pub fn check_key(key: &[u8]) -> Vec<u8> {
	let mut criteria: Vec<u8> = Vec::new();

	//Must be a valid UTF-8 String
	let key = from_utf8(&key);
	match key {
		Ok(_val) => criteria.extend_from_slice("Ok: Must be a valid string\n".as_bytes()),
		Err(_err) => {
			criteria.extend_from_slice("Err: Must be a valid string\n".as_bytes());
			return criteria;
		},
	}
	let key = key.unwrap();

	//Must be correctly formatted
	let mut valid_separator = true;
	let mut valid_values = true;
	let mut i = 0;

	for char in key.chars() {
		if (i != 0) && ((i + 1) % 3 == 0) {
			if char != ':' {
				valid_separator = false;
			}
		} else {
			match char {
				'0' => (),
				'1' => (),
				'2' => (),
				'3' => (),
				'4' => (),
				'5' => (),
				'6' => (),
				'7' => (),
				'8' => (),
				'9' => (),
				'A' => (),
				'B' => (),
				'C' => (),
				'D' => (),
				'E' => (),
				'F' => (),
				_ => valid_values = false,
			};
		}
		i += 1;
	}
	if key.chars().last() == Some(':') {
		valid_separator = false;
	}

	if valid_separator {
		criteria.extend_from_slice("Ok: Every pair of hexadecimal digits must be \
		separated by ':'\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Every pair of hexadecimal digits must be \
		separated by ':'\n".as_bytes());
	}

	if valid_values {
		criteria.extend_from_slice("Ok: Non-separators must be valid hexadecimal \
		digits (uppercase hexadecimal)\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Non-separators must be valid hexadecimal \
		digits (uppercase hexadecimal)\n".as_bytes());
	}

	criteria
}

pub fn check_email(email: &[u8]) -> Vec<u8> {
	let mut criteria: Vec<u8> = Vec::new();
	//Must be a valid UTF-8 String
	let email = from_utf8(email);
	match email {
		Ok(_val) => criteria.extend_from_slice("Ok: Must be a valid string\n".as_bytes()),
		Err(_err) => {
			criteria.extend_from_slice("Err: Must be a valid string\n".as_bytes());
			return criteria;
		},
	}
	let email = email.unwrap();

	//Must be in the form Prefix-@-Domain
	let amp_index = email.find('@');
	if (!amp_index.is_none()) && (amp_index > Some(0)) && (amp_index < Some(email.len() - 1)) {
		criteria.extend_from_slice("Ok: Must be in the form Prefix-@-Domain\n".as_bytes());
	} else {
		criteria.extend_from_slice("Err: Must be in the form Prefix-@-Domain\n".as_bytes());
	}

	let strs: Vec<&str> = email.clone().split('@').collect();

    let mut valid_domain = false;
    let mut valid_prefix = false;
    if strs.len() == 2 {
    	let prefix_len = Some(strs[0].len());
    	let cond_prefix_len = (prefix_len > Some(0)) && (prefix_len < Some(64));
    	let cond_char_types = strs[0].chars().all(|c| !c.is_uppercase() && ( c.is_alphanumeric() || c == '-' || c == '_' || c =='.' ) );
    	valid_prefix = cond_prefix_len && cond_char_types;

    	let domain_strs: Vec<&str> = strs[1].clone().split('.').collect();
    	if domain_strs.len() == 2 {
			let user_len = Some(domain_strs[0].len());
			let top_len = Some(domain_strs[1].len());
			let cond_char_types = strs[1].chars().all(|c| !c.is_uppercase() && ( c.is_alphanumeric() || c == '-' || c == '_' || c =='.' ) );
			let cond_user_len = (user_len > Some(0)) && (user_len < Some(64));
			let cond_top_len = (top_len > Some(1)) && (top_len < Some(7));
			valid_domain = cond_char_types && cond_top_len && cond_user_len;
		}
    }

	//Prefix must be valid
	if valid_prefix {
			criteria.extend_from_slice("Ok: Prefix must be valid\n".as_bytes());
	} else {
			criteria.extend_from_slice("Err: Prefix must be valid\n".as_bytes());
	}

    //Domain must be valid
    if valid_domain {
    	criteria.extend_from_slice("Ok: Domain must be valid\n".as_bytes());
    } else {
        	criteria.extend_from_slice("Err: Domain must be valid\n".as_bytes());
   	}

	criteria
}

// The pallet's runtime storage items.
// https://substrate.dev/docs/en/knowledgebase/runtime/storage
decl_storage! {
	// A unique name is used to ensure that the pallet's storage items are isolated.
	// This name may be updated, but each pallet in the runtime must use a unique name.
	// ---------------------------------
	trait Store for Module<T: Config> as SiipModule {
		// Learn more about declaring storage items:
		// https://substrate.dev/docs/en/knowledgebase/runtime/storage#declaring-storage-items
		pub CertificateMap get(fn domain_to_certificate): map hasher(blake2_128_concat) Vec<u8> => Certificate<T::AccountId>;
		pub ReverseMap get(fn ip_to_certificates): map hasher(blake2_128_concat) Vec<u8> => Vec<Certificate<T::AccountId>>;
	}
}

// Pallets use events to inform users when important changes are made.
// https://substrate.dev/docs/en/knowledgebase/runtime/events
decl_event!(
	pub enum Event<T> where AccountId = <T as frame_system::Config>::AccountId {
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
	pub enum Error for Module<T: Config> {
		InvalidOwner,
		InvalidDomain,
		InvalidIP,
		InvalidInfo,
		InvalidKey,
		DomainAlreadyTaken,
		NonexistentDomain,
		DifferentOwner,
		NoModifications,
		InvalidEmail
	}
}

// Dispatchable functions allows users to interact with the pallet and invoke state changes.
// These functions materialize as "extrinsics", which are often compared to transactions.
// Dispatchable functions must be an notated with a weight and must return a DispatchResult.
decl_module! {
	pub struct Module<T: Config> for enum Call where origin: T::Origin {
		// Errors must be initialized if they are used by the pallet.
		type Error = Error<T>;

		// Events must be initialized if they are used by the pallet.
		fn deposit_event() = default;

		#[weight = 1_000_000]
		pub fn register_certificate(
			origin,
			name: Vec<u8>,
			domain: Vec<u8>,
			ip_addr: Vec<u8>,
			info: Vec<u8>,
			key: Vec<u8>,
			email: Vec<u8>
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;

			//Input validation
			ensure!(!from_utf8(&check_name(&name)).unwrap().contains("Err:"), Error::<T>::InvalidOwner);
			ensure!(!from_utf8(&check_domain(&domain)).unwrap().contains("Err:"), Error::<T>::InvalidDomain);
			ensure!(!from_utf8(&check_ip(&ip_addr)).unwrap().contains("Err:"), Error::<T>::InvalidIP);
			ensure!(!from_utf8(&check_info(&info)).unwrap().contains("Err:"), Error::<T>::InvalidInfo);
			ensure!(!from_utf8(&check_key(&key)).unwrap().contains("Err:"), Error::<T>::InvalidKey);
			ensure!(!from_utf8(&check_email(&email)).unwrap().contains("Err:"), Error::<T>::InvalidEmail);

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
				email: email.clone()
			};

			CertificateMap::<T>::insert(&domain, cert.clone());

			//Adds it to the reverse lookup table
			let mut certs = ReverseMap::<T>::take(&ip_addr.clone());
			certs.push(cert.clone());
			ReverseMap::<T>::insert(&ip_addr, certs);

			Self::deposit_event(RawEvent::CertificateRegistered(cert, sender));
			Ok(())
		}

		#[weight = 1_000_000]
		pub fn modify_certificate(
			origin,
			name: Vec<u8>,
			domain: Vec<u8>,
			ip_addr: Vec<u8>,
			info: Vec<u8>,
			key: Vec<u8>,
			email: Vec<u8>
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;


			//Input validation
			ensure!(!from_utf8(&check_name(&name)).unwrap().contains("Err:"), Error::<T>::InvalidOwner);
			ensure!(!from_utf8(&check_domain(&domain)).unwrap().contains("Err:"), Error::<T>::InvalidDomain);
			ensure!(!from_utf8(&check_ip(&ip_addr)).unwrap().contains("Err:"), Error::<T>::InvalidIP);
			ensure!(!from_utf8(&check_info(&info)).unwrap().contains("Err:"), Error::<T>::InvalidInfo);
			ensure!(!from_utf8(&check_key(&key)).unwrap().contains("Err:"), Error::<T>::InvalidKey);
			ensure!(!from_utf8(&check_email(&email)).unwrap().contains("Err:"), Error::<T>::InvalidEmail);

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
				email: email.clone()
			};

			//Ensures that the owner of the domain is the sender
			let old_cert = CertificateMap::<T>::get(&domain);
			ensure!(sender == old_cert.owner_id, Error::<T>::DifferentOwner);

			//Ensures that there is some modification
			ensure!(cert != old_cert, Error::<T>::NoModifications);

			CertificateMap::<T>::take(&domain);
			CertificateMap::<T>::insert(&domain, cert.clone());

			//Modifies the reverse lookup map
			let mut certs = ReverseMap::<T>::take(&ip_addr.clone());
			certs.retain(|x| *x.domain != domain[..]);
			certs.push(cert.clone());
			ReverseMap::<T>::insert(&ip_addr, certs);

			Self::deposit_event(RawEvent::CertificateModified(cert, old_cert, sender));
			Ok(())
		}

		#[weight = 1_000_000]
		pub fn remove_certificate(
			origin,
			domain: Vec<u8>,
		) -> dispatch::DispatchResult{

			let sender = ensure_signed(origin)?;

			//Input validation
			ensure!(!from_utf8(&check_domain(&domain)).unwrap().contains("Err:"), Error::<T>::InvalidDomain);

			//Ensures that the domain already exists
			ensure!(CertificateMap::<T>::contains_key(&domain), Error::<T>::NonexistentDomain);

			//Ensures that the owner of the domain is the sender
			let old_cert = CertificateMap::<T>::get(&domain);
			ensure!(sender == old_cert.owner_id, Error::<T>::DifferentOwner);

			CertificateMap::<T>::take(&domain);

			//Deletes the certificate from the reverse lookup map
			let mut certs = ReverseMap::<T>::take(&old_cert.ip_addr);
			certs.retain(|x| *x.domain != domain[..]);
			ReverseMap::<T>::insert(&old_cert.ip_addr, certs);

			Self::deposit_event(RawEvent::CertificateRemoved(old_cert, sender));
			Ok(())
		}

		fn on_finalize(_n: T::BlockNumber) {
			T::inflationary_reward();
		}
	}
}
