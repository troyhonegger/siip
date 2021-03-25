import React, { useEffect, useState } from 'react';
import { Grid, Form, Input, Label } from 'semantic-ui-react';

import { useSubstrate } from './substrate-lib';
import { TxGroupButton } from './substrate-lib/components';

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

  const updateFields = (_, data) => {
    setFormState(formState => {
      const { state, value } = data;
      const { ind, paramField: { type } } = state;
      const inputParams = [...formState.inputParams];
      inputParams[ind] = { type, value };
      return { ...formState, inputParams };
    });
  };

  const getOptionalMsg = (interxType) =>
    interxType === 'RPC'
      ? 'Optional Parameter'
      : 'Leaving this field as blank will submit a NONE value';

  console.log('attr should be:');
  console.log({ interxType, palletRpc, callable, inputParams, paramFields });

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
              onChange={updateFields}
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
  return <Main {...props} />;
}
