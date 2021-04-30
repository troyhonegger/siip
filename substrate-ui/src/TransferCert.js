import React, { useState } from 'react';
import './css/Siip.css';
import { SubmitButton, Field } from './SiipCommon';

export default function TransferCert (props) {
  return (
    <div className='row'>
      <div className='column'>
        <OfferDomain accountPair={props.accountPair}/>
      </div>
      <div className='column'>
        <AcceptDomain />
      </div>
    </div>
  );
}

function OfferDomain (props) {
  const [inputDomain, setInputDomain] = useState('');
  const [domainValidity, setDomainValidity] = useState('');
  const updateInputDomain = (event) => {
    const domain = event.target.value;
    setInputDomain(domain);
    validateField('validate_domain', domain).then(data => {
      setDomainValidity(data.result);
      if (data.result.includes('Err: ')) {
        setValid(false);
      } else {
        setValid(true);
      }
    });
  };

  const [rcptAddr, setRcptAddr] = useState('');
  const updateRcptAddr = (event) => {
    const addr = event.target.value;
    setRcptAddr(addr);
  };

  const [valid, setValid] = useState(false);

  return (
    <div className="card">
      <h3>
        Offer a domain:
      </h3>
      <Field
        label='Domain Name:'
        value={inputDomain}
        criteria={domainValidity}
        placeholder='website.com'
        onChange={updateInputDomain}
        enable={true}
      />
      <Field
        label='Recipient:'
        value={rcptAddr}
        placeholder='6Fz9rcQpD...'
        onChange={updateRcptAddr}
        enable={true}
      />
      <SubmitButton
        domain={inputDomain}
        rcptAddr={rcptAddr}
        method='TransferOffer'
        enable={valid}
        accountPair={props.accountPair}
      />
    </div>
  );
}

function AcceptDomain (props) {
  return (
    <p>
      Accept
    </p>
  );
}

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
