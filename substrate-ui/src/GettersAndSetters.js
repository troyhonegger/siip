import React, { useEffect, useState } from 'react';
import './css/GettersAndSetters.css';
import TextareaAutosize from 'react-autosize-textarea';
// import { useSubstrate } from './substrate-lib';
// import { Dropdown, Form, Grid, Input, Label } from 'semantic-ui-react';
// import { TxButton, TxGroupButton } from './substrate-lib/components';

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
    </div>
  );
}

// Input validation!

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
      <RegisterCertificate name={name} domain={domain} ipAddr={ipAddr} info={info} publicKey={publicKey}/>
      <ModifyCertificate/>
      <RemoveCertificate/>
    </div>
  );
}
