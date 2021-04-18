import React, { useState } from 'react';
import { Button, Dropdown, Input, Modal } from 'semantic-ui-react';

import { useSubstrate } from '../substrate-lib';
import { TxButton } from '../substrate-lib/components';
import { STATUS } from '../substrate-lib/components/TxButton';

const convictionOptions = enactmentPeriod => [
  {
    text: '0.1x voting balance, no locking period after enactment',
    value: 0
  },
  {
    text: `1x voting balance, locked for ${enactmentPeriod} blocks after enactment`,
    value: 1
  },
  {
    text: `2x voting balance, locked for ${2 * enactmentPeriod} blocks after enactment`,
    value: 2
  },
  {
    text: `3x voting balance, locked for ${4 * enactmentPeriod} blocks after enactment`,
    value: 3
  }
].map((item) => {
  return { ...item, key: item.value };
});

const VoteModal = ({ referendum, accountPair }) => {
  const [isOpen, setOpen] = useState(false);
  const [balance, setBalance] = useState('0');
  const [conviction, setConviction] = useState(0);
  const setClose = () => {
    setOpen(false);
    setBalance('0');
    setConviction(0);
  };
  const { api } = useSubstrate();
  const enactmentPeriod = api.consts.democracy.enactmentPeriod.toNumber();
  const setStatus = status => {
    if (status === STATUS.READY) {
      setClose();
    }
  };
  return (
    <Modal open={isOpen} onOpen={() => setOpen(true)}
      trigger={<Button className="blue">Vote</Button>}
    >
      <Modal.Header>Vote on Referendum {referendum.index.toHuman()}</Modal.Header>
      <Modal.Content>
        <Input label="Vote Value" value={balance} onChange={e => setBalance(e.target.value)}></Input>
        <div>
          <Dropdown
            options={convictionOptions(enactmentPeriod)} selection value={conviction}
            onChange={e => setConviction(e.target.value)}
          >
          </Dropdown>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button className="red" onClick={setClose}>Cancel</Button>
        <TxButton
          label='Vote Nay'
          type='SIGNED-TX'
          accountPair={accountPair}
          setStatus={setStatus}
          attrs={{
            palletRpc: 'democracy',
            callable: 'vote',
            inputParams: [referendum.index, { Standard: { balance, vote: { aye: false, conviction } } }],
            paramFields: [
              { name: 'referendumIndex', type: 'ReferendumIndex', optional: false },
              { name: 'vote', type: 'AccountVote', optional: false }
            ],
            interxType: 'EXTRINSIC'
          }}
        />
        <TxButton
          label='Vote Aye'
          type='SIGNED-TX'
          accountPair={accountPair}
          setStatus={setStatus}
          attrs={{
            palletRpc: 'democracy',
            callable: 'vote',
            inputParams: [referendum.index, { Standard: { balance, vote: { aye: true, conviction } } }],
            paramFields: [
              { name: 'referendumIndex', type: 'ReferendumIndex', optional: false },
              { name: 'vote', type: 'AccountVote', optional: false }
            ],
            interxType: 'EXTRINSIC'
          }}
        />
      </Modal.Actions>
    </Modal>
  );
};

export default VoteModal;
