use crate::{Error, mock::*};
use frame_support::{assert_ok, assert_noop};
use crate::Certificate;
use frame_system::ensure_signed;
use crate::mock::new_test_ext;

type String = Vec<u8>;

pub const CERTIFICATE_VERSION: i32 = 1;
pub const EMPTY_CERTIFICATE: i32 = 0;

const NAME: &str = "Adrian Teigen";
const DOMAIN: &str = "adrianteigen.com";
const IP_ADDR: &str = "13.49.70.106";
const INFO: &str ="{ \"Algorithm\": \"RSA\",   \"Key Size\": \"32\",   \"Exponent\": \"65537\" }";
const KEY: &str = "B4:02:EE:13";

#[test]
fn register_certificate() {
	new_test_ext().execute_with(|| {
		//Registers a certificate
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		//Ensures that it was saved correctly
		let response = SiipModule::get_certificate(Vec::<u8>::from(DOMAIN));
		let expected = Certificate {
			version_number: CERTIFICATE_VERSION,
			owner_id: ensure_signed(Origin::signed(1)).unwrap(),
			name: NAME.into(),
			key: KEY.into(),
			info: INFO.into(),
			ip_addr: IP_ADDR.into(),
			domain: DOMAIN.into(),
		};
		assert_eq!(expected, response);
	});
}

#[test]
fn already_taken() {
	new_test_ext().execute_with(|| {
		//Register the first certificate
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		//Ensure that the second one returns an error
		assert_noop!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		), Error::<Test>::DomainAlreadyTaken);
	});
}

#[test]
fn invalid_domain() {
	new_test_ext().execute_with(|| {
		let new_domain: String =
			"Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft.de".into();

		//Domain name is too long
		assert_noop!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			new_domain.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		), Error::<Test>::InvalidDomain);

		//Domain contains an invalid symbol
		let new_domain: String = "hans*müller.de".into();
		assert_noop!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			new_domain.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		), Error::<Test>::InvalidDomain);
	});
}

#[test]
fn invalid_signature() {
	new_test_ext().execute_with(|| {
		//Does not provide a signature
		assert!(SiipModule::register_certificate(
			Origin::none(),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		).is_err());
	});
}

#[test]
fn uppercase_domain() {
	new_test_ext().execute_with(|| {
		//A domain with a domain containing uppercase characters
		let new_domain: String = "AdrianTeigen.com".into();
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			new_domain.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		//Ensure that the saved domain is undercase
		let response = SiipModule::get_certificate(Vec::<u8>::from(DOMAIN));
		let expected = Certificate {
			version_number: 1,
			owner_id: ensure_signed(Origin::signed(1)).unwrap(),
			name: NAME.into(),
			info: INFO.into(),
			key: KEY.into(),
			ip_addr: IP_ADDR.into(),
			domain: DOMAIN.into(),
		};
		assert_eq!(expected, response);
	});
}

#[test]
fn modify_certificate() {
	new_test_ext().execute_with(|| {
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		let other_public_key: String = "01:23:45:67:89:AB:CD:EF".into();
		assert_ok!(SiipModule::modify_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			other_public_key.clone(),
		));

		let response = SiipModule::get_certificate(Vec::<u8>::from(DOMAIN));
		let expected = Certificate {
			version_number: CERTIFICATE_VERSION,
			owner_id: ensure_signed(Origin::signed(1)).unwrap(),
			name: NAME.into(),
			info: INFO.into(),
			key: other_public_key.clone(),
			ip_addr: IP_ADDR.into(),
			domain: DOMAIN.into(),
		};
		assert_eq!(expected, response);
	})
}

#[test]
fn modify_nonexistant() {
	new_test_ext().execute_with(|| {
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		assert_noop!(SiipModule::modify_certificate(
			Origin::signed(1),
			NAME.into(),
			"A_different_domain".into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		), Error::<Test>::NonexistentDomain);
	})
}

#[test]
fn modify_uppercase_domain() {
	new_test_ext().execute_with(|| {
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		assert_noop!(SiipModule::modify_certificate(
			Origin::signed(1),
			NAME.into(),
			"AdrianTeigen.com".into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		), Error::<Test>::NoModifications);
	})
}

#[test]
fn modify_invalid_signature() {
	new_test_ext().execute_with(|| {
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		//Transaction is not signed
		assert!(SiipModule::modify_certificate(
			Origin::none(),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			"A new public key that I don't feel like typing.".into()
		).is_err());
	})
}

#[test]
fn delete_certificate() {
	new_test_ext().execute_with(|| {
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		assert_ok!(SiipModule::remove_certificate(Origin::signed(1), DOMAIN.into()));

		let empty_cert = SiipModule::get_certificate(Vec::<u8>::from(DOMAIN));
		assert!(empty_cert.version_number == EMPTY_CERTIFICATE);
	})
}

#[test]
fn delete_nonexistent() {
	new_test_ext().execute_with(|| {
		assert_noop!(SiipModule::remove_certificate(Origin::signed(1), DOMAIN.into()), Error::<Test>::NonexistentDomain);
	})
}

#[test]
fn delete_invalid_signature() {
	new_test_ext().execute_with(|| {
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			INFO.into(),
			KEY.into()
		));

		assert!(SiipModule::remove_certificate(Origin::none(), DOMAIN.into()).is_err());
	})
}

#[test]
fn invalid_json() {
	new_test_ext().execute_with(|| {
		assert_noop!(SiipModule::register_certificate(
			Origin::signed(1),
			NAME.into(),
			DOMAIN.into(),
			IP_ADDR.into(),
			"This }{{ is not valid json formatting.".into(),
			KEY.into()
		), Error::<Test>::InvalidInfo);
	})
}

#[test]
fn invalid_ip() {
	new_test_ext().execute_with(|| {
		let new_ip: String = "2001:0db8:85a3:0000:0000:8a2e:0370:7334".into();

		assert_noop!(SiipModule::register_certificate(
				Origin::signed(1),
				NAME.into(),
				DOMAIN.into(),
				new_ip.into(),
				INFO.into(),
				KEY.into()
			), Error::<Test>::InvalidIP);

		let new_ip: String = "256.256.256.256".into();
		assert_noop!(SiipModule::register_certificate(
				Origin::signed(1),
				NAME.into(),
				DOMAIN.into(),
				new_ip.into(),
				INFO.into(),
				KEY.into()
			), Error::<Test>::InvalidIP);

		let new_ip: String = "-1.-1.-1.-1".into();
		assert_noop!(SiipModule::register_certificate(
				Origin::signed(1),
				NAME.into(),
				DOMAIN.into(),
				new_ip.into(),
				INFO.into(),
				KEY.into()
			), Error::<Test>::InvalidIP);
	})
}

#[test]
fn invalid_key() {
	new_test_ext().execute_with(|| {
		let new_key: String = "G".into();
		assert_noop!(SiipModule::register_certificate(
				Origin::signed(1),
				NAME.into(),
				DOMAIN.into(),
				IP_ADDR.into(),
				INFO.into(),
				new_key.into()
			), Error::<Test>::InvalidKey);

		let new_key: String = "01/02/56".into();
		assert_noop!(SiipModule::register_certificate(
				Origin::signed(1),
				NAME.into(),
				DOMAIN.into(),
				IP_ADDR.into(),
				INFO.into(),
				new_key.into()
			), Error::<Test>::InvalidKey);

		let new_key: String = ":::::".into();
		assert_noop!(SiipModule::register_certificate(
				Origin::signed(1),
				NAME.into(),
				DOMAIN.into(),
				IP_ADDR.into(),
				INFO.into(),
				new_key.into()
			), Error::<Test>::InvalidKey);

	})
}