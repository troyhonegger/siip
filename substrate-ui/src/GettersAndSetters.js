import React, { useState } from 'react';
import './css/GettersAndSetters.css';
import TextareaAutosize from 'react-autosize-textarea';
import { TxButton } from './substrate-lib/components';
import { Button } from 'semantic-ui-react';

function SubmitButton (props) {
  const { accountPair } = props;

  const nameField = { name: 'name', type: 'Bytes', optional: false };
  const domainField = { name: 'domain', type: 'Bytes', optional: false };
  const ipAddrField = { name: 'ip_addr', type: 'Bytes', optional: false };
  const infoField = { name: 'info', type: 'Bytes', optional: false };
  const keyField = { name: 'key', type: 'Bytes', optional: false };
  const emailField = { name: 'email', type: 'Bytes', optional: false };

  const name = { type: 'Bytes', value: props.name };
  const domain = { type: 'Bytes', value: props.domain };
  const ipAddr = { type: 'Bytes', value: props.ipAddr };
  const info = { type: 'Bytes', value: props.info };
  const publicKey = { type: 'Bytes', value: props.publicKey };
  const email = { type: 'Bytes', value: props.email };

  const interxType = 'EXTRINSIC';
  const palletRpc = 'siipModule';

  let callable = '';
  let paramFields = [];
  let inputParams = [];
  let color = 'black';
  if (props.method === 'Register') {
    color = 'green';
    callable = 'registerCertificate';
    paramFields = [nameField, domainField, ipAddrField, infoField, keyField, emailField];
    inputParams = [name, domain, ipAddr, info, publicKey, email];
  } else if (props.method === 'Modify') {
    color = 'yellow';
    callable = 'modifyCertificate';
    paramFields = [nameField, domainField, ipAddrField, infoField, keyField, emailField];
    inputParams = [name, domain, ipAddr, info, publicKey, email];
  } else if (props.method === 'Delete') {
    color = 'red';
    callable = 'removeCertificate';
    paramFields = [domainField];
    inputParams = [domain];
  }

  const [status, setStatus] = useState('');

  if (props.enable) {
    return (
      <div>
        <br />
        <div className='button_pos'>
          <TxButton
            label='Submit'
            type='SIGNED-TX'
            color={color}
            accountPair={accountPair}
            setStatus={setStatus}
            attrs={{ interxType, palletRpc, callable, inputParams, paramFields }}
          />
        </div>
        <p>
          {status}
        </p>
      </div>
    );
  } else {
    return (
      <div>
        <br />
        <div className='button_pos'>
          <Button disabled>
            Submit
          </Button>
        </div>
        <p>
          {status}
        </p>
      </div>
    );
  }
}

async function updateDb (domain, setDbName, setDbIpAddr, setDbInfo, setDbPublicKey, setDbEmail, setDomainExists) {
  const palletRpc = 'siipModule';
  const callable = 'certificateMap';

  const queryResHandler = result => {
    if (result.isNone) {
      console.log('Waiting...');
    } else {
      console.log('json:');
      console.log(json);


      // Fields will be empty/0 if a certificate has not been stored
      const json = JSON.parse(result);
      setDbName(json.owner_name);
      setDbIpAddr(json.ip_addr);
      setDbInfo(json.public_key_info);
      setDbPublicKey(json.public_key);
      setDbEmail(json.email);

      // The version_number is only 0 if the certificate does not exist
      if (json.version_number === 0) {
        setDomainExists(false);
      } else {
        setDomainExists(true);
      }
    }
  };

  // eslint-disable-next-line
  api.query[palletRpc][callable](domain, queryResHandler);
}

export default function GettersAndSetters (props) {
  const [inputDomain, setInputDomain] = useState('');
  const [domainValidity, setDomainValidity] = useState('');
  const updateInputDomain = (event) => {
    const domain = event.target.value;
    setInputDomain(domain);
    updateDb(domain, setDbName, setDbIpAddr, setDbInfo, setDbPublicKey, setDbEmail, setDomainExists).then();
    validateField('validate_domain', domain).then(data => {
      setDomainValidity(data.result);
    });
  };

  const [inputName, setInputName] = useState('');
  const [nameValidity, setNameValidity] = useState('');
  const updateInputName = (event) => {
    const name = event.target.value;
    setInputName(name);
    validateField('validate_name', name).then(data => {
      setNameValidity(data.result);
    });
  };

  const validateField = async (method, parameter) => {
    // For more info: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: method,
        params: [parameter]
      })
    };

    const response = await fetch('http://localhost:9933', requestOptions);
    return response.json();
  };

  const [inputIpAddr, setInputIpAddr] = useState('');
  const [ipAddrValidity, setIpAddrValidity] = useState('');
  const updateInputIpAddr = (event) => {
    const ipAddr = event.target.value;
    setInputIpAddr(ipAddr);
    validateField('validate_ip', ipAddr).then(data => {
      setIpAddrValidity(data.result);
    });
  };

  const [inputInfo, setInputInfo] = useState('');
  const [infoValidity, setInfoValidity] = useState('');
  const updateInputInfo = (event) => {
    const info = event.target.value;
    setInputInfo(info);
    validateField('validate_info', info).then(data => {
      setInfoValidity(data.result);
    });
  };

  const [inputPublicKey, setInputPublicKey] = useState('');
  const [publicKeyValidity, setPublicKeyValidity] = useState('');
  const updateInputPublicKey = (event) => {
    const publicKey = event.target.value;
    setInputPublicKey(publicKey);
    validateField('validate_key', publicKey).then(data => {
      setPublicKeyValidity(data.result);
    });
  };

  const [inputEmail, setInputEmail] = useState('');
  const [emailValidity, setEmailValidity] = useState('');
  const updateInputEmail = (event) => {
    const email = event.target.value;
    setInputEmail(email);
    validateField('validate_email', email).then(data => {
      setEmailValidity(data.result);
    });
  };

  const [dbName, setDbName] = useState('');
  const [dbIpAddr, setDbIpAddr] = useState('');
  const [dbInfo, setDbInfo] = useState('');
  const [dbPublicKey, setDbPublicKey] = useState('');
  const [dbEmail, setDbEmail] = useState('');
  const [domainExists, setDomainExists] = useState(false);

  // Must initialize the Validity fields (else they'll be empty until the first character is pressed
  validateField('validate_domain', inputDomain).then(data => {
    setDomainValidity(data.result);
    updateValidity();
  });
  validateField('validate_name', inputName).then(data => {
    setNameValidity(data.result);
    updateValidity();
  });
  validateField('validate_ip', inputIpAddr).then(data => {
    setIpAddrValidity(data.result);
    updateValidity();
  });
  validateField('validate_info', inputInfo).then(data => {
    setInfoValidity(data.result);
    updateValidity();
  });
  validateField('validate_key', inputPublicKey).then(data => {
    setPublicKeyValidity(data.result);
    updateValidity();
  });
  validateField('validate_email', inputEmail).then(data => {
    setEmailValidity(data.result);
    updateValidity();
  });

  const [allFieldsValid, setAllFieldsValid] = useState(false);
  const updateValidity = () => {
    if (domainValidity.includes('Err:') ||
      nameValidity.includes('Err:') ||
      ipAddrValidity.includes('Err:') ||
      infoValidity.includes('Err:') ||
      publicKeyValidity.includes('Err:') ||
      emailValidity.includes('Err:')) {
      setAllFieldsValid(false);
    } else {
      setAllFieldsValid(true);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h3>
          Lookup an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} criteria={domainValidity} placeholder='website.com' onChange={updateInputDomain}/>
          <br />
          <br />
          <Static label='Owner&apos;s Name:' value={dbName} enable={false}/>
          <Static label='IPv4 Address:' value={dbIpAddr} enable={false}/>
          <Static label='Info:' value={dbInfo} enable={false}/>
          <Static label='Public Key:' value={dbPublicKey} enable={false}/>
          <Static label='Email:' value={dbEmail} enable={false}/>
        </form>
      </div>
      <div className="card">
        <h3> .
          Register an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} criteria={domainValidity} placeholder='website.com' onChange={updateInputDomain}/>
          <br />
          <br />
          <Name value={inputName} onChange={updateInputName} criteria={nameValidity} placeholder='John Smith' enable={!domainExists}/>
          <IpAddr value={inputIpAddr} onChange={updateInputIpAddr} criteria={ipAddrValidity} placeholder='192.168.0.1' enable={!domainExists}/>
          <Info value={inputInfo} onChange={updateInputInfo} criteria={infoValidity} placeholder='{ "country": "US",...' enable={!domainExists}/>
          <PublicKey value={inputPublicKey} onChange={updateInputPublicKey} criteria={publicKeyValidity} placeholder='04:EB:9A:AF:31:11...' enable={!domainExists}/>
          <Email value={inputEmail} onChange={updateInputEmail} criteria={emailValidity} placeholder='jsmith@purdue.edu' enable={!domainExists}/>
        </form>
        <SubmitButton
          {...props}
          domain={inputDomain}
          name={inputName}
          ipAddr={inputIpAddr}
          info={inputInfo}
          publicKey={inputPublicKey}
          email={inputEmail}
          method='Register'
          enable={!domainExists && allFieldsValid}
        />
      </div>
      <div className="card">
        <h3>
          Modify an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} criteria={domainValidity} placeholder='website.com' onChange={updateInputDomain}/>
          <br />
          <br />
          <Name value={inputName} onChange={updateInputName} criteria={nameValidity} placeholder='John Smith' enable={domainExists}/>
          <IpAddr value={inputIpAddr} onChange={updateInputIpAddr} criteria={ipAddrValidity} placeholder='192.168.0.1' enable={domainExists}/>
          <Info value={inputInfo} onChange={updateInputInfo} criteria={infoValidity} placeholder='{ "country": "US",...' enable={domainExists}/>
          <PublicKey value={inputPublicKey} onChange={updateInputPublicKey} criteria={publicKeyValidity} placeholder='04:EB:9A:AF:31:11...' enable={domainExists}/>
          <Email value={inputEmail} onChange={updateInputEmail} criteria={emailValidity} placeholder='jsmith@purdue.edu' enable={domainExists}/>
        </form>
        <SubmitButton
          {...props}
          domain={inputDomain}
          name={inputName}
          ipAddr={inputIpAddr}
          info={inputInfo}
          publicKey={inputPublicKey}
          email={inputEmail}
          method='Modify'
          enable={domainExists && domainValidity && nameValidity && ipAddrValidity && infoValidity && publicKeyValidity && emailValidity }
        />
      </div>
      <div className="card">
        <h3>
          Delete an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} criteria={domainValidity} placeholder='website.com' onChange={updateInputDomain}/>
          <br />
          <br />
          <Static label='Owner&apos;s Name:' value={dbName} enable={false}/>
          <Static label='IPv4 Address:' value={dbIpAddr} enable={false}/>
          <Static label='Info:' value={dbInfo} enable={false}/>
          <Static label='Public Key:' value={dbPublicKey} enable={false}/>
          <Static label='Email:' value={dbEmail} enable={false}/>
        </form>
        <SubmitButton
          {...props}
          domain={inputDomain}
          name={inputName}
          ipAddr={inputIpAddr}
          info={inputInfo}
          publicKey={inputPublicKey}
          email={inputEmail}
          method='Delete'
          enable={domainExists && domainValidity && nameValidity && ipAddrValidity && infoValidity && publicKeyValidity && emailValidity}
        />
      </div>
    </div>
  );
}

  const width = 200;
  const staticName = <Static label='Owner&apos;s Name:' value={dbName}/>;
  const staticIpAddr = <Static label='IPv4 Address:' value={dbIpAddr}/>;
  const staticInfo = <Static label='Info:' value={dbInfo}/>;
  const staticPublicKey = <Static label='Public Key:' value={dbPublicKey}/>;

  function dynDomain (enable) {
    return (
      <Field
        label='Domain Name:'
        value={inputDomain}
        criteria={domainValidity}
        placeholder='website.com'
        onChange={updateInputDomain}
        enable={enable}
      />
    );
  }

  function dynName (enable) {
    return (
      <Field
        label='Owner&apos;s Name:'
        value={inputName}
        criteria={nameValidity}
        placeholder='John Smith'
        onChange={updateInputName}
        enable={enable}
      />
    );
  }

  function dynIpAddr (enable) {
    return (
      <Field
        label='Ipv4 Address:'
        value={inputIpAddr}
        criteria={ipAddrValidity}
        placeholder='192.168.0.1'
        onChange={updateInputIpAddr}
        enable={enable}
      />
    );
  }

  function dynInfo (enable) {
    return (
      <Field
        label='Info:'
        value={inputInfo}
        criteria={infoValidity}
        placeholder='{ "country": "US",...'
        onChange={updateInputInfo}
        enable={enable}
      />
    );
  }

  function dynPublicKey (enable) {
    return (
      <Field
        label='Public Key:'
        value={inputPublicKey}
        criteria={publicKeyValidity}
        placeholder='04:EB:9A:AF:31:11...'
        onChange={updateInputPublicKey}
        enable={enable}
      />
    );
  }

  function submit (method, enable) {
    if (method === '') {
      return (
        <div></div>
      );
    }

    return (
      <SubmitButton
        {...props}
        domain={inputDomain}
        name={inputName}
        ipAddr={inputIpAddr}
        info={inputInfo}
        publicKey={inputPublicKey}
        method={method}
        enable={enable}
      />
    );
  }

  function staticCard (title, dynamic, enableField, method, enableButton) {
    return (
      <div className="card">
        <h3>
          {title}
        </h3>
        <form>
          {dynDomain(true)}
          <br />
          <br />
          {dynamic ? dynName(enableField) : staticName}
          {dynamic ? dynIpAddr(enableField) : staticIpAddr}
          {dynamic ? dynInfo(enableField) : staticInfo}
          {dynamic ? dynPublicKey(enableField) : staticPublicKey}
        </form>
        {submit(method, enableButton)}
      </div>
    );
  }

  const [revIp, setRevIp] = useState('');
  const [revCerts, setRevCerts] = useState('');

  function reverseLookupCard () {
    return (
      <div className='card'>
        <h3>
          Reverse Lookup
        </h3>
        <form>
          <Field
            label='Ipv4 Address:'
            value={revIp}
            placeholder='192.168.0.1'
            onChange={reverseLookup}
            enable={true}
          />
          <br />
          <br />
          <Grid stackable columns='equal'>
          {revCerts}
          </Grid>
        </form>
      </div>
    );
  }

  const reverseLookup = (event) => {
    const ip = event.target.value;
    setRevIp(ip);

    // Searches for all ip addresses
    const palletRpc = 'siipModule';
    const callable = 'reverseMap';

    const queryResHandler = result => {
      if (result.isNone) {
        console.log('Waiting...');
      } else {
        // Fields will be empty/0 if a certificate has not been stored
        const json = JSON.parse(result);

        const certs = [];
        let i = 0;
        json.forEach(cert => {
          // The version_number is only 0 if the certificate does not exist
          if (cert.version_number !== 0) {
            const DomainField = <Static label='Domain Name:' value={cert.domain_name}/>;
            const NameField = <Static label='Owner&apos;s Name:' value={cert.owner_name}/>;
            const IpField = <Static label='IPv4 Address:' value={cert.ip_addr}/>;
            const InfoField = <Static label='Info:' value={cert.public_key_info}/>;
            const PublicKeyField = <Static label='Public Key:' value={cert.public_key}/>;

            certs.push(
              <div className="card" key={i++}>
                  {DomainField}
                  <br />
                  <br />
                  {NameField}
                  {IpField}
                  {InfoField}
                  {PublicKeyField}
              </div>
            );
          }
        });

        if (revCerts !== <Grid.Row>{certs}</Grid.Row>) {
          setRevCerts(<Grid.Row>{certs}</Grid.Row>);
        }
      }
    };

    // eslint-disable-next-line
    api.query[palletRpc][callable](ip, queryResHandler);
  };

function Email (props) {
  const [isFocused, setFocused] = useState(false);

  return (
      <div>
        <label>Owner's Email:</label>
        <div>
          <TextareaAutosize
              style={{ width: width }}
              className="input_field"
              placeholder={props.placeholder}
              value={props.value}
              onChange={props.onChange}
              disabled={!props.enable}
              onFocus={(e) => {
                console.log('Focused');
                setFocused(true);
              }}
              onBlur={(e) => {
                console.log('Not focused');
                setFocused(false);
              }}
          />
          <Validation criteria={props.criteria} enable={isFocused}/>
        </div>
      </div>
  );
}

function Static (props) {
  return (
    <div className="container">
      {staticCard('Lookup an SIIP Certificate', false, false, '', false)}
      {staticCard('Register an SIIP Certificate', true, !domainExists, 'Register', !domainExists && allFieldsValid)}
      {staticCard('Modify an SIIP Certificate', true, domainExists, 'Modify', domainExists && allFieldsValid)}
      {staticCard('Delete an SIIP Certificate', false, domainExists, 'Delete', domainExists && domainValidity)}
      {reverseLookupCard()}
    </div>
  );
}
