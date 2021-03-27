import React, { useState } from 'react';
import './css/GettersAndSetters.css';
import TextareaAutosize from 'react-autosize-textarea';

import { useSubstrate } from './substrate-lib';
import utils from "./substrate-lib/utils";

function transformParams (paramFields, inputParams) {
    // if `opts.emptyAsNull` is true, empty param value will be added to res as `null`.
    //   Otherwise, it will not be added
    const paramVal = inputParams.map(inputParam => {
      // To cater the js quirk that `null` is a type of `object`.
      if (typeof inputParam === 'object' && inputParam !== null && typeof inputParam.value === 'string') {
        return inputParam.value.trim();
      } else if (typeof inputParam === 'string') {
        return inputParam.trim();
      }
      return inputParam;
    });
    const params = paramFields.map((field, ind) => ({ ...field, value: paramVal[ind] || null }));

    return params.reduce((memo, { type = 'string', value }) => {
      if (value == null || value === '') return (opts.emptyAsNull ? [...memo, null] : memo);

      let converted = value;

      // Deal with a vector
      if (type.indexOf('Vec<') >= 0) {
        converted = converted.split(',').map(e => e.trim());
        converted = converted.map(single => isNumType(type)
          ? (single.indexOf('.') >= 0 ? Number.parseFloat(single) : Number.parseInt(single))
          : single
        );
        return [...memo, converted];
      }

      // Deal with a single value
      if (isNumType(type)) {
        converted = converted.indexOf('.') >= 0 ? Number.parseFloat(converted) : Number.parseInt(converted);
      }
      return [...memo, converted];
    }, []);
}

function isNumType (type) {
  utils.paramConversion.num.some(el => type.indexOf(el) >= 0);
}

function submitRegister (props) {

}

function RegisterCertificate (props) {
  const { api, jsonrpc } = useSubstrate();
  const { accountPair } = props;
  const [unsub, setUnsub] = useState(null);

  let message = '';

  const txResHandler = ({ status }) =>
    status.isFinalized
      ? message = `😉 Finalized. Block hash: ${status.asFinalized.toString()}`
      : message = `Current transaction status: ${status.type}`;

  const txErrHandler = err => {
    message = `😞 Transaction Failed: ${err.toString()}`;
  }

  const palletRpc = 'siipModule';
  const name_field = { name: "name", type: "Bytes", optional: false };
  const domain_field = { name: "domain", type: "Bytes", optional: false };
  const ip_addr_field = { name: "ip_addr", type: "Bytes", optional: false };
  const info_field = { name: "info", type: "Bytes", optional: false };
  const key_field = { name: "key", type: "Bytes", optional: false };

  let registerSubmit = async () => {
    const callable = 'registerCertificate';

    let paramFields = [domain_field, name_field, ip_addr_field, info_field, key_field];

    let inputParams = [
    { type: "Bytes", value: domain },
    { type: "Bytes", value: name },
    { type: "Bytes", value: ipAddr },
    { type: "Bytes", value: info },
    { type: "Bytes", value: key }];

    const transformed = transformParams(paramFields, inputParams);

    const txExecute = transformed
      ? api.tx[palletRpc][callable](...transformed)
      : api.tx[palletRpc][callable]();

    const unsub = await txExecute.signAndSend(accountPair, txResHandler)
      .catch(txErrHandler);
    setUnsub(() => unsub);
  }

  let [domain, setDomain] = useState('');
  const updateDomain = (event) => {
    setDomain(event.target.value);
  }

  let [name, setName] = useState('');
  const updateName = (event) => {
    setName(event.target.value);
  }

  let [ipAddr, setIpAddr] = useState('');
  const updateIpAddr = (event) => {
    setIpAddr(event.target.value);
  }

  let [info, setInfo] = useState('');
  const updateInfo = (event) => {
    setInfo(event.target.value);
  }

  let [key, setKey] = useState('');
  const updateKey = (event) => {
    setKey(event.target.value);
  }

  return (
    <div className="card">
      <h3>
        Register an SIIP Certificate
      </h3>
      <form>
        <label>Domain Name:</label>
        <div>
          <TextareaAutosize className="input_field" placeholder={props.domain} value={domain} onChange={updateDomain}/>
        </div>
        <br />
        <br />
        <label>Owner's Name:</label>
        <div>
          <TextareaAutosize className="input_field" placeholder={props.name} value={name} onChange={updateName}/>
        </div>
        <label>IPv4 Address:</label>
        <div>
          <TextareaAutosize className="input_field" placeholder={props.ipAddr} value={ipAddr} onChange={updateIpAddr}/>
        </div>
        <label>Info:</label>
        <div>
          <TextareaAutosize className="input_field" placeholder={props.info} value={info} onChange={updateInfo}/>
        </div>
        <label>Public Key:</label>
        <div>
          <TextareaAutosize className="input_field" placeholder={props.publicKey} value={key} onChange={updateKey}/>
        </div>
      </form>
      <button onClick={() => registerSubmit()}>Submit</button>
    </div>
  );
}

class RegisterCertificate2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'Placeholder'
    };

    this.updateName = this.updateName.bind(this);
  }

  updateName(event) {
    console.log('Name is now: ' + event.target.value);
    this.setState({name: event.target.value});
  }

  render() {
    return (
      <form>
        <label>
          Essay:
          <textarea value={this.name} onChange={this.updateName} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    )
  }
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
  // const { accountPair } = props;
  const name = 'John Smith';
  const domain = 'website.com';
  const ipAddr = '192.168.0.1"';
  const info = '{ country": "US",...';
  const publicKey = '04:EB:9A:AF:31:11...';

  return (
    <div>
      <RegisterCertificate {...props} name={name} domain={domain} ipAddr={ipAddr} info={info} publicKey={publicKey}/>
      <RegisterCertificate2 {...props} />
      <ModifyCertificate/>
      <RemoveCertificate/>
    </div>
  );
}
