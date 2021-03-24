import React, { useEffect, useState } from 'react';
import { Grid, Form, Dropdown, Input, Label } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';
import { TxButton, TxGroupButton } from './substrate-lib/components';

const argIsOptional = (arg) =>
  arg.type.toString().startsWith('Option<');

function Main (props) {
  const { api, jsonrpc } = useSubstrate();
  const { accountPair } = props;
  const [status, setStatus] = useState(null);

  const [interxType] = useState('EXTRINSIC');
  const [paramFields, setParamFields] = useState([]);

  const initFormState = {
    palletRpc: '',
    callable: '',
    inputParams: []
  };

  const [formState, setFormState] = useState(initFormState);
  const { palletRpc, callable, inputParams } = formState;

  const getApiType = (api, interxType) => api.tx;

  const siipModule = {key: "siipModule", value: "siipModule", text: "siipModule" };
  const palletRPCs = [siipModule];

  const registerCertificate = { key: "registerCertificate", value: "registerCertificate", text: "registerCertificate" };
  const callables = [registerCertificate];

  const updateParamFields = () => {
    if (!api || palletRpc === '' || callable === '') {
      setParamFields([]);
      return;
    }

    let paramFields = [];

    const metaArgs = api.tx[palletRpc][callable].meta.args;

    if (metaArgs && metaArgs.length > 0) {
      paramFields = metaArgs.map(arg => ({
        name: arg.name.toString(),
        type: arg.type.toString(),
        optional: argIsOptional(arg)
      }));
    }

    setParamFields(paramFields);
  };

  useEffect(updateParamFields, [api, interxType, palletRpc, callable, jsonrpc]);

  formState.palletRpc = 'siipModule';
  formState.callable = 'registerCertificate';

  const onPalletCallableParamChange = (_, data) => {
    setFormState(formState => {
      let res;
      const { state, value } = data;
      if (typeof state === 'object') {
        // Input parameter updated
        const { ind, paramField: { type } } = state;
        const inputParams = [...formState.inputParams];
        inputParams[ind] = { type, value };
        res = { ...formState, inputParams };
      } else if (state === 'palletRpc') {
        console.log('state: ' + state)
        console.log('value: ' + value)
        res = { ...formState, [state]: value, callable: '', inputParams: [] };
      } else if (state === 'callable') {
        res = { ...formState, [state]: value, inputParams: [] };
      }
      return res;
    });
  };

  const getOptionalMsg = (interxType) =>
    interxType === 'RPC'
      ? 'Optional Parameter'
      : 'Leaving this field as blank will submit a NONE value';

  return (
    <Grid.Column width={8}>
      <h1>Pallet Interactor</h1>
      <Form>
        {paramFields.map((paramField, ind) =>
          <Form.Field key={`${paramField.name}-${paramField.type}`}>
            <Input
              placeholder={paramField.type}
              fluid
              type='text'
              label={paramField.name}
              state={{ ind, paramField }}
              value={ inputParams[ind] ? inputParams[ind].value : '' }
              onChange={onPalletCallableParamChange}
            />
            { paramField.optional
              ? <Label
                basic
                pointing
                color='teal'
                content = { getOptionalMsg(interxType) }
              />
              : null
            }
          </Form.Field>
        )}
        <Form.Field style={{ textAlign: 'center' }}>
          <TxGroupButton
            accountPair={accountPair}
            setStatus={setStatus}
            attrs={{ interxType, palletRpc, callable, inputParams, paramFields }}
          />
        </Form.Field>
        <div style={{ overflowWrap: 'break-word' }}>{status}</div>
      </Form>
    </Grid.Column>
  );
}

export default function Interactor (props) {
  const { api } = useSubstrate();
  return api.tx ? <Main {...props} /> : null;
}
