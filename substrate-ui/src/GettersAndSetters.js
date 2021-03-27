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

function Field (props) {
  return (
    <div>
      <label>{ props.label }</label>
      <div>
        <TextareaAutosize id={ props.name } placeholder={ props.placeholder }
                          className="input_field" />
      </div>
    </div>
  );
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
  const interxType = 'EXTRINSIC';
  const name = { name: "name", type: "Bytes", optional: false };
  const domain = { name: "domain", type: "Bytes", optional: false };
  const ip_addr = { name: "ip_addr", type: "Bytes", optional: false };
  const info = { name: "info", type: "Bytes", optional: false };
  const key = { name: "key", type: "Bytes", optional: false };

  let registerSubmit = async () => {
    const callable = 'registerCertificate';

    let paramFields = [domain, name, ip_addr, info, key];

    let inputParams = [
    { type: "Bytes", value: "A Name" },
    { type: "Bytes", value: "adomain.com" },
    { type: "Bytes", value: "127.0.0.1" },
    { type: "Bytes", value: "{}" },
    { type: "Bytes", value: "42:42:42:42" }];

    const transformed = transformParams(paramFields, inputParams);

    const txExecute = transformed
      ? api.tx[palletRpc][callable](...transformed)
      : api.tx[palletRpc][callable]();

    const unsub = await txExecute.signAndSend(accountPair, txResHandler)
      .catch(txErrHandler);
    setUnsub(() => unsub);

    console.log('signature is:');
    console.log(accountPair);
    console.log('Reminder: The Interactor.js/TxButton also has an incorrect signature.');

    return;
  }

  return (
    <div className="card">
      <h3>
        Register an SIIP Certificate
      </h3>
      <form>
        <Field label="Domain Name:" id="register_domain_name" placeholder={props.domain} />
        <br />
        <br />
        <Field label="Owner's Name:" id="register_owners_name" placeholder={props.name} />
        <Field label="IPv4 Address:" id="register_ipv4_address" placeholder={props.ipAddr}/>
        <Field label="Info:" id="register_info" placeholder={props.info}/>
        <Field label="Public Key:" id="register_public_key" placeholder={props.publicKey}/>
      </form>
      <button onClick={() => registerSubmit()}>Submit</button>
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
  // const { accountPair } = props;
  const name = 'John Smith';
  const domain = 'website.com';
  const ipAddr = '192.168.0.1"';
  const info = '{ country": "US",...';
  const publicKey = '04:EB:9A:AF:31:11...';

  return (
    <div>
      <RegisterCertificate {...props} name={name} domain={domain} ipAddr={ipAddr} info={info} publicKey={publicKey}/>
      <ModifyCertificate/>
      <RemoveCertificate/>
    </div>
  );
}
