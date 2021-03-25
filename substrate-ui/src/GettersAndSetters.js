import React, { useEffect, useState } from 'react';
import './css/GettersAndSetters.css';
import TextareaAutosize from 'react-autosize-textarea';
import { Grid, Form, Input, Label, Button } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';
import { TxButton, TxGroupButton } from './substrate-lib/components';
import {web3FromSource} from "@polkadot/extension-dapp";
import utils from "./substrate-lib/utils";

const argIsOptional = (arg) =>
  arg.type.toString().startsWith('Option<');

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

function RegisterForm (props) {
  const { api, jsonrpc } = useSubstrate();
  const { accountPair } = props;
  const [status, setStatus] = useState(null);
  const [interxType] = useState('EXTRINSIC');
  const [unsub, setUnsub] = useState(null);

  let getFromAcct = async () => {
    const {
      address,
      meta: { source, isInjected }
    } = accountPair;
    let fromAcct;

    // signer is from Polkadot-js browser extension
    if (isInjected) {
      const injected = await web3FromSource(source);
      fromAcct = address;
      api.setSigner(injected.signer);
    } else {
      fromAcct = accountPair;
    }

    return fromAcct;
  };

  const txResHandler = ({ status }) =>
    status.isFinalized
      ? setStatus(`😉 Finalized. Block hash: ${status.asFinalized.toString()}`)
      : setStatus(`Current transaction status: ${status.type}`);

  const txErrHandler = err => {
    setStatus(`😞 Transaction Failed: ${err.toString()}`);
  }

  const transformParams = (paramFields, inputParams, opts = { emptyAsNull: true }) => {
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
  };

  const isNumType = type =>
    utils.paramConversion.num.some(el => type.indexOf(el) >= 0);

  let registerSubmit = async () => {
    const palletRpc = 'siipModule';
    const callable = 'registerCertificate';
    const interxType = 'EXTRINSIC'

    let paramFields = [
    { name: "name", type: "Bytes", optional: false },
    { name: "domain", type: "Bytes", optional: false },
    { name: "ip_addr", type: "Bytes", optional: false },
    { name: "info", type: "Bytes", optional: false },
    { name: "key", type: "Bytes", optional: false }];

    let inputParams = [
    { type: "Bytes", value: "A" },
    { type: "Bytes", value: "B" },
    { type: "Bytes", value: "C" },
    { type: "Bytes", value: "D" },
    { type: "Bytes", value: "E" }];

    // paramFields = Array.from(paramFields);
    // inputParams = Array.from(inputParams);

    console.log('paramFields is:');
    console.log(paramFields);
    console.log('inputParams is:');
    console.log(inputParams);

    const fromAcct = await getFromAcct();
    const transformed = transformParams(paramFields, inputParams);

    console.log('transformed: ' + transformed);

    const txExecute = transformed
      ? api.tx[palletRpc][callable](...transformed)
      : api.tx[palletRpc][callable]();

    const unsub = await txExecute.signAndSend(fromAcct, txResHandler)
      .catch(txErrHandler);
    setUnsub(() => unsub);

    return;
  }

  // <TxButton
  //   label='Signed'
  //   type='SIGNED-TX'
  //   color='blue'
  //   {...props}
  // />

  // const { palletRpc, callable, inputParams, paramFields } = attrs;

  // async () => {
  //   const fromAcct = await getFromAcct();
  //   const transformed = transformParams(paramFields, inputParams);
  //   // transformed can be empty parameters
  //
  //   const txExecute = transformed
  //     ? api.tx[palletRpc][callable](...transformed)
  //     : api.tx[palletRpc][callable]();
  //
  //   const unsub = await txExecute.signAndSend(fromAcct, txResHandler)
  //     .catch(txErrHandler);
  //   setUnsub(() => unsub);
  // };

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
      <RegisterForm {...props} name={name} domain={domain} ipAddr={ipAddr} info={info} publicKey={publicKey}/>
      <ModifyCertificate/>
      <RemoveCertificate/>
    </div>
  );
}
