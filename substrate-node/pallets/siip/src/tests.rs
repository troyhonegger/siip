use crate::{Error, mock::*};
use frame_support::{assert_ok, assert_noop};
use crate::Certificate;
use frame_system::ensure_signed;
use crate::mock::new_test_ext;

#[test]
fn register_certificate() {
	new_test_ext().execute_with(|| {
		//The certificate we are testing
		let name: Vec<u8> = "Adrian Teigen".into();
		let domain: Vec<u8> = "adrianteigen.com".into();
		let ip_addr: Vec<u8> = "13.49.70.106".into();
		let public_key_info: Vec<u8> = "Algorithm: RSA\nKey Size: 2048\nExponent: 65537".into();
		let public_key: Vec<u8> =
			"B4:02:EE:13:C2:98:6F:B9:33:51:2A:CC:95:C2:B6:D5:06:C9:59:33:CD:62:E6:DD:B3:5B:8F:68:\
			64:BC:C9:AC:FA:BB:41:3E:D7:AF:23:DC:3B:40:B7:C4:3C:64:31:6F:8C:B6:C5:D5:D6:DD:A4:2F:5C:\
			7D:C5:F7:11:B7:42:A6:B7:DB:AC:0F:71:67:10:34:01:9D:41:5B:5C:C5:1C:16:08:24:55:61:1E:F9:\
			9A:8A:70:75:8C:DA:55:E5:E5:AE:36:08:65:13:1C:55:BC:24:2A:64:17:96:94:2E:6B:DC:AC:63:9D:\
			EA:88:98:D6:F3:E6:40:FE:94:76:AC:7F:A1:DA:5C:4C:D6:4E:CE:81:50:F3:A3:33:E0:97:20:3D:51:\
			90:15:51:A0:79:7E:10:78:5D:08:AA:A2:D5:18:34:BA:87:11:5F:D6:F9:A8:42:6C:81:AC:6A:04:2D:\
			14:82:D5:BC:96:90:F7:3D:72:FC:67:B5:68:4F:4A:12:38:2F:93:05:02:92:70:93:E5:78:FB:72:12:\
			C0:2E:DD:7B:28:50:A1:ED:5E:2D:6B:0B:C5:18:91:7E:8A:98:8A:2E:63:92:C9:8D:59:54:9D:2E:70:\
			6E:80:49:9D:07:C9:C1:AC:4A:F9:24:4E:85:44:D0:C1:4F:75:F7:65:B8:B9:32:12:0F".into();

		//Register and get
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			name.clone(),
			domain.clone(),
			ip_addr.clone(),
			public_key_info.clone(),
			public_key.clone()
		));
		let response = SiipModule::get_certificate(&domain);

		//Ensure that we get the correct certificate
		let expected = Certificate {
			version_number: 1,
			owner_id: ensure_signed(Origin::signed(1)).unwrap(),
			owner_name: name.clone(),
			public_key: public_key.clone(),
			public_key_info: public_key_info.clone(),
			ip_addr: ip_addr.clone(),
			domain_name: domain.clone(),
		};
		assert_eq!(expected, response);
	});
}

#[test]
fn register_certificate_already_taken() {
	new_test_ext().execute_with(|| {
		//The certificate we are testing
		let name: Vec<u8> = "Bob Bobson".into();
		let domain: Vec<u8> = "bobbobson.com".into();
		let ip_addr: Vec<u8> = "13.49.70.106".into();
		let public_key_info: Vec<u8> = "Algorithm: RSA\nKey Size: 2048\nExponent: 65537".into();
		let public_key: Vec<u8> =
			"B4:02:EE:13:C2:98:6F:B9:33:51:2A:CC:95:C2:B6:D5:06:C9:59:33:CD:62:E6:DD:B3:5B:8F:68:\
			64:BC:C9:AC:FA:BB:41:3E:D7:AF:23:DC:3B:40:B7:C4:3C:64:31:6F:8C:B6:C5:D5:D6:DD:A4:2F:5C:\
			7D:C5:F7:11:B7:42:A6:B7:DB:AC:0F:71:67:10:34:01:9D:41:5B:5C:C5:1C:16:08:24:55:61:1E:F9:\
			9A:8A:70:75:8C:DA:55:E5:E5:AE:36:08:65:13:1C:55:BC:24:2A:64:17:96:94:2E:6B:DC:AC:63:9D:\
			EA:88:98:D6:F3:E6:40:FE:94:76:AC:7F:A1:DA:5C:4C:D6:4E:CE:81:50:F3:A3:33:E0:97:20:3D:51:\
			90:15:51:A0:79:7E:10:78:5D:08:AA:A2:D5:18:34:BA:87:11:5F:D6:F9:A8:42:6C:81:AC:6A:04:2D:\
			14:82:D5:BC:96:90:F7:3D:72:FC:67:B5:68:4F:4A:12:38:2F:93:05:02:92:70:93:E5:78:FB:72:12:\
			C0:2E:DD:7B:28:50:A1:ED:5E:2D:6B:0B:C5:18:91:7E:8A:98:8A:2E:63:92:C9:8D:59:54:9D:2E:70:\
			6E:80:49:9D:07:C9:C1:AC:4A:F9:24:4E:85:44:D0:C1:4F:75:F7:65:B8:B9:32:12:0F".into();

		//Register the first certificate
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			name.clone(),
			domain.clone(),
			ip_addr.clone(),
			public_key_info.clone(),
			public_key.clone()
		));

		//Register the second certificate
		// let response = SiipModule::register_certificate(
		// 	Origin::signed(1),
		// 	name.clone(),
		// 	domain.clone(),
		// 	ip_addr.clone(),
		// 	public_key_info.clone(),
		// 	public_key.clone()
		// );

		//Ensure that the it returned an error
		//assert!(response.is_err());
		assert_noop!(SiipModule::register_certificate(
			Origin::signed(1),
			name.clone(),
			domain.clone(),
			ip_addr.clone(),
			public_key_info.clone(),
			public_key.clone()
		), Error::<Test>::DomainAlreadyTaken);


	});
}

#[test]
fn register_certificate_invalid_domain() {
	new_test_ext().execute_with(|| {
		let name: Vec<u8> = "Hans Müller".into();
		let domain: Vec<u8> = "Donaudampfschifffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft.de".into();
		let ip_addr: Vec<u8> = "13.49.70.106".into();
		let public_key_info: Vec<u8> = "Algorithm: RSA\nKey Size: 2048\nExponent: 65537".into();
		let public_key: Vec<u8> =
			"B4:02:EE:13:C2:98:6F:B9:33:51:2A:CC:95:C2:B6:D5:06:C9:59:33:CD:62:E6:DD:B3:5B:8F:68:\
			64:BC:C9:AC:FA:BB:41:3E:D7:AF:23:DC:3B:40:B7:C4:3C:64:31:6F:8C:B6:C5:D5:D6:DD:A4:2F:5C:\
			7D:C5:F7:11:B7:42:A6:B7:DB:AC:0F:71:67:10:34:01:9D:41:5B:5C:C5:1C:16:08:24:55:61:1E:F9:\
			9A:8A:70:75:8C:DA:55:E5:E5:AE:36:08:65:13:1C:55:BC:24:2A:64:17:96:94:2E:6B:DC:AC:63:9D:\
			EA:88:98:D6:F3:E6:40:FE:94:76:AC:7F:A1:DA:5C:4C:D6:4E:CE:81:50:F3:A3:33:E0:97:20:3D:51:\
			90:15:51:A0:79:7E:10:78:5D:08:AA:A2:D5:18:34:BA:87:11:5F:D6:F9:A8:42:6C:81:AC:6A:04:2D:\
			14:82:D5:BC:96:90:F7:3D:72:FC:67:B5:68:4F:4A:12:38:2F:93:05:02:92:70:93:E5:78:FB:72:12:\
			C0:2E:DD:7B:28:50:A1:ED:5E:2D:6B:0B:C5:18:91:7E:8A:98:8A:2E:63:92:C9:8D:59:54:9D:2E:70:\
			6E:80:49:9D:07:C9:C1:AC:4A:F9:24:4E:85:44:D0:C1:4F:75:F7:65:B8:B9:32:12:0F".into();

		//Domain name is too long
		assert_noop!(SiipModule::register_certificate(
			Origin::signed(1),
			name.clone(),
			domain.clone(),
			ip_addr.clone(),
			public_key_info.clone(),
			public_key.clone()
		), Error::<Test>::InvalidDomain);

		//Domain contains an invalid symbol
		let domain: Vec<u8> = "hans*müller.de".into();
		assert_noop!(SiipModule::register_certificate(
			Origin::signed(1),
			name.clone(),
			domain.clone(),
			ip_addr.clone(),
			public_key_info.clone(),
			public_key.clone()
		), Error::<Test>::InvalidDomain);
	});
}

#[test]
fn register_certificate_invalid_signature() {
	new_test_ext().execute_with(|| {
		let name: Vec<u8> = "Kaleem Schultz".into();
		let domain: Vec<u8> = "kaleemschultz.com".into();
		let ip_addr: Vec<u8> = "13.49.70.106".into();
		let public_key_info: Vec<u8> = "Algorithm: RSA\nKey Size: 2048\nExponent: 65537".into();
		let public_key: Vec<u8> =
			"B4:02:EE:13:C2:98:6F:B9:33:51:2A:CC:95:C2:B6:D5:06:C9:59:33:CD:62:E6:DD:B3:5B:8F:68:\
			64:BC:C9:AC:FA:BB:41:3E:D7:AF:23:DC:3B:40:B7:C4:3C:64:31:6F:8C:B6:C5:D5:D6:DD:A4:2F:5C:\
			7D:C5:F7:11:B7:42:A6:B7:DB:AC:0F:71:67:10:34:01:9D:41:5B:5C:C5:1C:16:08:24:55:61:1E:F9:\
			9A:8A:70:75:8C:DA:55:E5:E5:AE:36:08:65:13:1C:55:BC:24:2A:64:17:96:94:2E:6B:DC:AC:63:9D:\
			EA:88:98:D6:F3:E6:40:FE:94:76:AC:7F:A1:DA:5C:4C:D6:4E:CE:81:50:F3:A3:33:E0:97:20:3D:51:\
			90:15:51:A0:79:7E:10:78:5D:08:AA:A2:D5:18:34:BA:87:11:5F:D6:F9:A8:42:6C:81:AC:6A:04:2D:\
			14:82:D5:BC:96:90:F7:3D:72:FC:67:B5:68:4F:4A:12:38:2F:93:05:02:92:70:93:E5:78:FB:72:12:\
			C0:2E:DD:7B:28:50:A1:ED:5E:2D:6B:0B:C5:18:91:7E:8A:98:8A:2E:63:92:C9:8D:59:54:9D:2E:70:\
			6E:80:49:9D:07:C9:C1:AC:4A:F9:24:4E:85:44:D0:C1:4F:75:F7:65:B8:B9:32:12:0F".into();

		assert!(SiipModule::register_certificate(
			Origin::none(),
			name.clone(),
			domain.clone(),
			ip_addr.clone(),
			public_key_info.clone(),
			public_key.clone()
		).is_err());
	});
}

#[test]
fn register_certificate_uppercase_domain() {
	new_test_ext().execute_with(|| {
		//The certificate we are testing
		let name: Vec<u8> = "Armani Leal".into();
		let domain: Vec<u8> = "ArmaniLeal.com".into();
		let ip_addr: Vec<u8> = "13.49.70.106".into();
		let public_key_info: Vec<u8> = "Algorithm: RSA\nKey Size: 2048\nExponent: 65537".into();
		let public_key: Vec<u8> =
			"B4:02:EE:13:C2:98:6F:B9:33:51:2A:CC:95:C2:B6:D5:06:C9:59:33:CD:62:E6:DD:B3:5B:8F:68:\
			64:BC:C9:AC:FA:BB:41:3E:D7:AF:23:DC:3B:40:B7:C4:3C:64:31:6F:8C:B6:C5:D5:D6:DD:A4:2F:5C:\
			7D:C5:F7:11:B7:42:A6:B7:DB:AC:0F:71:67:10:34:01:9D:41:5B:5C:C5:1C:16:08:24:55:61:1E:F9:\
			9A:8A:70:75:8C:DA:55:E5:E5:AE:36:08:65:13:1C:55:BC:24:2A:64:17:96:94:2E:6B:DC:AC:63:9D:\
			EA:88:98:D6:F3:E6:40:FE:94:76:AC:7F:A1:DA:5C:4C:D6:4E:CE:81:50:F3:A3:33:E0:97:20:3D:51:\
			90:15:51:A0:79:7E:10:78:5D:08:AA:A2:D5:18:34:BA:87:11:5F:D6:F9:A8:42:6C:81:AC:6A:04:2D:\
			14:82:D5:BC:96:90:F7:3D:72:FC:67:B5:68:4F:4A:12:38:2F:93:05:02:92:70:93:E5:78:FB:72:12:\
			C0:2E:DD:7B:28:50:A1:ED:5E:2D:6B:0B:C5:18:91:7E:8A:98:8A:2E:63:92:C9:8D:59:54:9D:2E:70:\
			6E:80:49:9D:07:C9:C1:AC:4A:F9:24:4E:85:44:D0:C1:4F:75:F7:65:B8:B9:32:12:0F".into();

		//Register and get
		assert_ok!(SiipModule::register_certificate(
			Origin::signed(1),
			name.clone(),
			domain.clone(),
			ip_addr.clone(),
			public_key_info.clone(),
			public_key.clone()
		));

		//Ensure that the domain name is undercase
		let domain: Vec<u8> = "armanileal.com".into();
		let response = SiipModule::get_certificate(&domain);

		let expected = Certificate {
			version_number: 1,
			owner_id: ensure_signed(Origin::signed(1)).unwrap(),
			owner_name: name.clone(),
			public_key_info: public_key_info.clone(),
			public_key: public_key.clone(),
			ip_addr: ip_addr.clone(),
			domain_name: domain.clone(),
		};
		assert_eq!(expected, response);
	});
}
