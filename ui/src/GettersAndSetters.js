import React from 'react';
// import ReactDOM from 'react-dom';
import './css/GettersAndSetters.css';
import TextareaAutosize from 'react-autosize-textarea';

function Field (props) {
  return (
    <div>
      <label>{ props.label }</label>
      <div>
        <TextareaAutosize name={ props.name } id={ props.name } placeholder={ props.placeholder }
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
        <Field label="Owner's Name:" name="owners_name" placeholder={props.name} />
        <Field label="Domain Name:" name="domain_name" placeholder={props.domain} />
        <Field label="IPv4 Address:" name="ipv4_address" placeholder={props.ip_addr}/>
        <Field label="Info:" name="info" placeholder={props.info}/>
        <Field label="Public Key:" name="public_key" placeholder={props.public_key}/>
      </form>
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
  const name = "John Smith";
  const domain = "website.com";
  const ip_addr = "192.168.0.1";
  const info = "{ country\": \"US\",..."
  const public_key = "04:EB:9A:AF:31:11...";


  return (
    <div>
      <RegisterCertificate name={name} domain={domain} ip_addr={ip_addr} info={info} public_key={public_key}/>
      <ModifyCertificate/>
      <RemoveCertificate/>
    </div>
  );
}
