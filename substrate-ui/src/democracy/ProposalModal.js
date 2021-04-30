import React, { useState } from 'react';
import { Button, Input, Modal } from 'semantic-ui-react';

import { useSubstrate } from '../substrate-lib';
import { TxButton } from '../substrate-lib/components';
import { STATUS } from '../substrate-lib/components/TxButton';
import { hexStringToByteArr } from '../utils';

const NewProposalModal = ({ accountPair }) => {
  const { api } = useSubstrate();
  const [isOpen, setOpen] = useState(false);
  const [preimageHash, setPreimageHash] = useState('');
  const [balance, setBalance] = useState('' + api.consts.democracy.minimumDeposit);
  const [preimageHashBytes, setPreimageHashBytes] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const setClose = () => {
    setOpen(false);
    setBalance('' + api.consts.democracy.minimumDeposit);
    setPreimageHash('');
    setTxStatus(null);
  };
  const setStatus = status => {
    setTxStatus(status);
    if (status === STATUS.IN_BLOCK || status === STATUS.READY) {
      setClose();
    }
  };
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
        <Button className="red" onClick={setClose}>Cancel</Button>
        <TxButton
          label='Submit Proposal'
          type='SIGNED-TX'
          accountPair={accountPair}
          setStatus={setStatus}
          disabled={txStatus === STATUS.SENDING}
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
