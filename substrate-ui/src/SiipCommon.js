import React, { useState } from 'react';
import './css/Siip.css';
import TextareaAutosize from 'react-autosize-textarea';
import { TxButton } from './substrate-lib/components';
import { Button } from 'semantic-ui-react';

const width = 200;

export function SubmitButton (props) {
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

export async function updateDb (domain, setDbName, setDbIpAddr, setDbInfo, setDbPublicKey, setDomainExists) {
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

export function Validation (props) {
  if (!props.enable && !props.alwaysValidate) {
    return (
      <div></div>
    );
  }
  if (!props.criteria) {
    return (
      <div></div>
    );
  }

  const criteria = props.criteria.split('\n');
  const criteriaElements = [];
  for (let i = 0; i < criteria.length; i++) {
    if (criteria[i] === '') {
      continue;
    }

    if (criteria[i].startsWith('Ok: ') && props.alwaysValidate && !props.enable) {
      continue;
    }

    let color;
    if (criteria[i].startsWith('Ok:')) {
      color = 'LightGreen';
      criteria[i] = criteria[i].slice(4);
    } else {
      color = 'Coral';
      criteria[i] = criteria[i].slice(5);
    }

    criteriaElements.push(
      <div className='small_card' key={i} style={{ background: color, width: width }}>
        <p style={{ color: 'black', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
          {criteria[i]}
        </p>
      </div>
    );
  }
  return (
    <div>
      {criteriaElements}
    </div>
  );
}

export function Field (props) {
  const [isFocused, setFocused] = useState(false);

  return (
    <div>
      <label>{props.label}</label>
      <div>
        <TextareaAutosize
          style={{ width: width }}
          className="input_field"
          placeholder={props.placeholder}
          value={props.value}
          disabled={!props.enable}
          onChange={props.onChange}
          onFocus={(e) => {
            setFocused(true);
          }}
          onBlur={(e) => {
            setFocused(false);
          }}
        />
        <Validation criteria={props.criteria} enable={isFocused} alwaysValidate={props.alwaysValidate}/>
      </div>
    </div>
  );
}

export function Static (props) {
  return (
    <Field disabled={true} enable={false} {...props}/>
  );
}
