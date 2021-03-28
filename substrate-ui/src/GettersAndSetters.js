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

  const name = { type: 'Bytes', value: props.name };
  const domain = { type: 'Bytes', value: props.domain };
  const ipAddr = { type: 'Bytes', value: props.ipAddr };
  const info = { type: 'Bytes', value: props.info };
  const publicKey = { type: 'Bytes', value: props.publicKey };

  const interxType = 'EXTRINSIC';
  const palletRpc = 'siipModule';

  let callable = '';
  let paramFields = [];
  let inputParams = [];
  let color = 'black';
  if (props.method === 'Register') {
    color = 'green';
    callable = 'registerCertificate';
    paramFields = [nameField, domainField, ipAddrField, infoField, keyField];
    inputParams = [name, domain, ipAddr, info, publicKey];
  } else if (props.method === 'Modify') {
    color = 'yellow';
    callable = 'modifyCertificate';
    paramFields = [nameField, domainField, ipAddrField, infoField, keyField];
    inputParams = [name, domain, ipAddr, info, publicKey];
  } else if (props.method === 'Delete') {
    color = 'red';
    callable = 'removeCertificate';
    paramFields = [domainField];
    inputParams = [domain];
  }

  const [status, setStatus] = useState('');

  console.log('enable is: ' + props.enable);
  if (props.enable) {
    return (
      <div>
        <br />
        <TxButton
          label='Submit'
          type='SIGNED-TX'
          color={color}
          accountPair={accountPair}
          setStatus={setStatus}
          attrs={{ interxType, palletRpc, callable, inputParams, paramFields }}
        />
        <p>
          {status}
        </p>
      </div>
    );
  } else {
    return (
      <div>
        <br />
        <Button disabled>
          Submit
        </Button>
        <p>
          {status}
        </p>
      </div>
    );
  }
}

async function updateDb (domain, setDbName, setDbIpAddr, setDbInfo, setDbPublicKey, setDomainExists) {
  const palletRpc = 'siipModule';
  const callable = 'certificateMap';

  const queryResHandler = result => {
    if (result.isNone) {
      console.log('Waiting...');
    } else {
      // Fields will be empty/0 if a certificate has not been stored
      const json = JSON.parse(result);
      setDbName(json.owner_name);
      setDbIpAddr(json.ip_addr);
      setDbInfo(json.public_key_info);
      setDbPublicKey(json.public_key);

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
  const [inputDomain, setInputDomain] = useState('website.com');
  const updateInputDomain = (event) => {
    setInputDomain(event.target.value);
    updateDb(event.target.value, setDbName, setDbIpAddr, setDbInfo, setDbPublicKey, setDomainExists).then();
  };

  const [inputName, setInputName] = useState('John Smith');
  const updateInputName = (event) => {
    setInputName(event.target.value);
  };

  const [inputIpAddr, setInputIpAddr] = useState('192.168.0.1');
  const updateInputIpAddr = (event) => {
    setInputIpAddr(event.target.value);
  };

  const [inputInfo, setInputInfo] = useState('{}');
  const updateInputInfo = (event) => {
    setInputInfo(event.target.value);
  };

  const [inputPublicKey, setInputPublicKey] = useState('04:EB:9A:AF:31:11');
  const updateInputPublicKey = (event) => {
    setInputPublicKey(event.target.value);
  };

  const [dbName, setDbName] = useState('');
  const [dbIpAddr, setDbIpAddr] = useState('');
  const [dbInfo, setDbInfo] = useState('');
  const [dbPublicKey, setDbPublicKey] = useState('');
  const [domainExists, setDomainExists] = useState(false);

  return (
    <div className="container">
      <div className="card">
        <h3>
          Lookup an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} onChange={updateInputDomain}/>
          <br />
          <br />
          <Static label='Owner&apos;s Name:' value={dbName} enable={domainExists}/>
          <Static label='IPv4 Address:' value={dbIpAddr} enable={domainExists}/>
          <Static label='Info:' value={dbInfo} enable={domainExists}/>
          <Static label='Public Key:' value={dbPublicKey} enable={domainExists}/>
        </form>
      </div>
      <div className="card">
        <h3>
          Register an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} onChange={updateInputDomain}/>
          <br />
          <br />
          <Name value={inputName} onChange={updateInputName} enable={!domainExists}/>
          <IpAddr value={inputIpAddr} onChange={updateInputIpAddr} enable={!domainExists}/>
          <Info value={inputInfo} onChange={updateInputInfo} enable={!domainExists}/>
          <PublicKey value={inputPublicKey} onChange={updateInputPublicKey} enable={!domainExists}/>
        </form>
        <SubmitButton
          {...props}
          domain={inputDomain}
          name={inputName}
          ipAddr={inputIpAddr}
          info={inputInfo}
          publicKey={inputPublicKey}
          method='Register'
          enable={!domainExists}
        />
      </div>
      <div className="card">
        <h3>
          Modify an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} onChange={updateInputDomain}/>
          <br />
          <br />
          <Name value={inputName} onChange={updateInputName} enable={domainExists}/>
          <IpAddr value={inputIpAddr} onChange={updateInputIpAddr} enable={domainExists}/>
          <Info value={inputInfo} onChange={updateInputInfo} enable={domainExists}/>
          <PublicKey value={inputPublicKey} onChange={updateInputPublicKey} enable={domainExists}/>
        </form>
        <SubmitButton
          {...props}
          domain={inputDomain}
          name={inputName}
          ipAddr={inputIpAddr}
          info={inputInfo}
          publicKey={inputPublicKey}
          method='Modify'
          enable={domainExists}
        />
      </div>
      <div className="card">
        <h3>
          Delete an SIIP Certificate
        </h3>
        <form>
          <DomainName value={inputDomain} onChange={updateInputDomain}/>
        </form>
        <SubmitButton
          {...props}
          domain={inputDomain}
          name={inputName}
          ipAddr={inputIpAddr}
          info={inputInfo}
          publicKey={inputPublicKey}
          method='Delete'
          enable={domainExists}
        />
      </div>
    </div>
  );
}

function DomainName (props) {
  return (
    <div>
      <label>Domain Name:</label>
      <div>
        <TextareaAutosize
          className="input_field"
          placeholder='John Smith'
          value={props.value}
          onChange={props.onChange}
        />
      </div>
    </div>
  );
}

function Name (props) {
  return (
    <div>
      <label>Owner's Name:</label>
      <div>
        <TextareaAutosize
          className="input_field"
          placeholder='website.com'
          value={props.value}
          onChange={props.onChange}
          disabled={!props.enable}
        />
      </div>
    </div>
  );
}

function IpAddr (props) {
  return (
    <div>
      <label>IPv4 Address:</label>
      <div>
        <TextareaAutosize
          className="input_field"
          placeholder='192.168.0.1'
          value={props.value}
          onChange={props.onChange}
          disabled={!props.enable}
        />
      </div>
    </div>
  );
}

function Info (props) {
  return (
    <div>
      <label>Info:</label>
      <div>
        <TextareaAutosize
          className="input_field"
          placeholder='{ country": "US",...'
          value={props.value}
          onChange={props.onChange}
          disabled={!props.enable}
        />
      </div>
    </div>
  );
}

function PublicKey (props) {
  return (
    <div>
      <label>Public Key:</label>
      <div>
        <TextareaAutosize
          className="input_field"
          placeholder='04:EB:9A:AF:31:11...'
          value={props.value}
          onChange={props.onChange}
          disabled={!props.enable}
        />
      </div>
    </div>
  );
}

function Static (props) {
  return (
    <div>
      <label>{props.label}</label>
      <div>
        <TextareaAutosize
          className="input_field"
          value={props.value}
          disabled={!props.enable}
        />
      </div>
    </div>
  );
}
