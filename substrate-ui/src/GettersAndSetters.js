import React, { useState } from 'react';
import './css/GettersAndSetters.css';
import TextareaAutosize from 'react-autosize-textarea';

import { TxGroupButton } from './substrate-lib/components';
import {Grid} from "semantic-ui-react";
import NodeInfo from "./NodeInfo";
import Metadata from "./Metadata";
import BlockNumber from "./BlockNumber";

function SubmitButton (props) {
  const { accountPair } = props;
  const nameField = { name: 'name', type: 'Bytes', optional: false };
  const domainField = { name: 'domain', type: 'Bytes', optional: false };
  const ipAddrField = { name: 'ip_addr', type: 'Bytes', optional: false };
  const infoField = { name: 'info', type: 'Bytes', optional: false };
  const keyField = { name: 'key', type: 'Bytes', optional: false };

  const interxType = 'EXTRINSIC';
  const palletRpc = 'siipModule';
  const callable = 'registerCertificate';
  const paramFields = [nameField, domainField, ipAddrField, infoField, keyField];
  const inputParams = [
    { type: 'Bytes', value: props.name },
    { type: 'Bytes', value: props.domain },
    { type: 'Bytes', value: props.ipAddr },
    { type: 'Bytes', value: props.info },
    { type: 'Bytes', value: props.publicKey }];

  // eslint-disable-next-line
  const [status, setStatus] = useState('');

  //console.log('accountPair:');
  //console.log(accountPair);
  //console.log('attrs:');
  //console.log({ interxType, palletRpc, callable, inputParams, paramFields });

  return (
    <div>
      <br />
      <TxGroupButton
        accountPair={accountPair}
        setStatus={setStatus}
        attrs={{ interxType, palletRpc, callable, inputParams, paramFields }}
      />
    </div>
  );
}

function RegisterCertificate (props) {
  const [domain, setDomain] = useState('website.com');
  const updateDomain = (event) => {
    setDomain(event.target.value);
  };

  const [name, setName] = useState('John Smith');
  const updateName = (event) => {
    setName(event.target.value);
  };

  const [ipAddr, setIpAddr] = useState('192.168.0.1');
  const updateIpAddr = (event) => {
    setIpAddr(event.target.value);
  };

  const [info, setInfo] = useState('{}');
  const updateInfo = (event) => {
    setInfo(event.target.value);
  };

  const [publicKey, setPublicKey] = useState('04:EB:9A:AF:31:11');
  const updatePublicKey = (event) => {
    setPublicKey(event.target.value);
  };

  return (
    <div className="container">
      <div className="card">
        <h3>
          Register an SIIP Certificate
        </h3>
        <form>
          <DomainName value={domain} onChange={updateDomain}/>
          <br />
          <br />
          <Name value={name} onChange={updateName}/>
          <IpAddr value={ipAddr} onChange={updateIpAddr}/>
          <Info value={info} onChange={updateInfo}/>
          <PublicKey value={publicKey} onChange={updatePublicKey}/>
        </form>
        <SubmitButton {...props} domain={domain} name={name} ipAddr={ipAddr} info={info} publicKey={publicKey}/>
      </div>
      <div className="card">
        <h3>
          Modify an SIIP Certificate
        </h3>
        <form>
          <DomainName value={domain} onChange={updateDomain}/>
          <br />
          <br />
          <Name value={name} onChange={updateName}/>
          <IpAddr value={ipAddr} onChange={updateIpAddr}/>
          <Info value={info} onChange={updateInfo}/>
          <PublicKey value={publicKey} onChange={updatePublicKey}/>
        </form>
        <SubmitButton {...props} domain={domain} name={name} ipAddr={ipAddr} info={info} publicKey={publicKey}/>
      </div>
      <div className="card">
        <h3>
          Delete an SIIP Certificate
        </h3>
        <form>
          <DomainName value={domain} onChange={updateDomain}/>
        </form>
        <SubmitButton {...props} domain={domain} name={name} ipAddr={ipAddr} info={info} publicKey={publicKey}/>
      </div>
    </div>
  );
}

// <Grid.Row stretched>
//   <NodeInfo />
//   <Metadata />
//   <BlockNumber />
//   <BlockNumber finalized />
// </Grid.Row>

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
        />
      </div>
    </div>
  );
}

function ModifyCertificate (props) {
  return (
    <h2>
      Modify
    </h2>
  );
}

function RemoveCertificate (props) {
  return (
    <h2>
      Remove
    </h2>
  );
}

export default function GettersAndSetters (props) {
  return (
    <div>
      <RegisterCertificate {...props} />
      <ModifyCertificate/>
      <RemoveCertificate/>
    </div>
  );
}
