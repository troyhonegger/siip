import React, { useState } from 'react';
import { Button, Input, Modal } from 'semantic-ui-react';

import { useSubstrate } from '../substrate-lib';
import { TxButton } from '../substrate-lib/components';
import { hexStringToByteArr } from '../utils';

const NewProposalModal = ({ accountPair }) => {
  const { api } = useSubstrate();
  const [isOpen, setOpen] = useState(false);
  const [preimageHash, setPreimageHash] = useState('');
  const [balance, setBalance] = useState('' + api.consts.democracy.minimumDeposit);
  const [preimageHashBytes, setPreimageHashBytes] = useState(null);

  return (
    <Modal open={isOpen} onOpen={() => setOpen(true)}
      trigger={<Button className="green">New Proposal</Button>}
    >
      <Modal.Header>
        Propose Runtime Upgrade
      </Modal.Header>
      <Modal.Content>
        <div>
          <Input label="Preimage Hash" value={preimageHash} onChange={e => {
            setPreimageHash(e.target.value);
            try {
              const bytes = hexStringToByteArr(e.target.value);
              setPreimageHashBytes(bytes);
            } catch (e) {
              if (!(e instanceof TypeError)) {
                throw e;
              }
            }
          }}></Input>
        </div>
        <div className="mt-2">
          <Input label="Balance" value={balance} onChange={e => setBalance(e.target.value)}></Input>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button className="red" onClick={() => setOpen(false)}>Cancel</Button>
        <TxButton
          label='Submit Proposal'
          type='SIGNED-TX'
          accountPair={accountPair}
          setStatus={(e) => console.log(e)}
          attrs={{
            palletRpc: 'democracy',
            callable: 'propose',
            inputParams: [preimageHashBytes, balance],
            paramFields: [
              { name: 'preimageHash', type: 'Bytes', optional: false },
              { name: 'balance', type: 'u128', optional: false }
            ],
            interxType: 'EXTRINSIC'
          }}
        />
      </Modal.Actions>
    </Modal>
  );
};

export default NewProposalModal;
