import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Modal } from 'semantic-ui-react';
import { useDropzone } from 'react-dropzone';

import { useSubstrate } from './substrate-lib';
import './Democracy.css';
import { TxButton } from './substrate-lib/components';
import classNames from 'classnames';

const ProposalRow = ({ imageHash, proposer }) => {
  return (
    <div className="proposal-card">
      <div>
        <span>Image Hash: </span> {imageHash}
      </div>
      <br></br>
      <div>
        <span> Proposer: </span> {proposer}
      </div>
      <button className="ui button">second</button>
    </div>
  );
};

const NewProposalModal = ({ accountPair }) => {
  const { api } = useSubstrate();
  const [isOpen, setOpen] = useState(false);
  const [preimageHash, setPreimageHash] = useState('');
  const [balance, setBalance] = useState(api.consts.democracy.minimumDeposit);
  return (
    <Modal open={isOpen} onOpen={() => setOpen(true)}
      trigger={<Button className="green">New Proposal</Button>}
    >
      <Modal.Header>
        Propose Runtime Upgrade
      </Modal.Header>
      <Modal.Content>
        <div>
          <Input label="Preimage Hash" value={preimageHash} onChange={e => setPreimageHash(e.target.value)}></Input>
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
            inputParams: [preimageHash, balance],
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

const NewPreimageModal = ({ accountPair }) => {
  const [isOpen, setOpen] = useState(false);
  const [preimage, setPreimage] = useState(null);
  const setClose = () => {
    setOpen(false);
    setPreimage(null);
  };
  const { api } = useSubstrate();
  const proposal = preimage && api._extrinsics.system.setCode(preimage);
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onabort = () => console.log('file reading was aborted');
    reader.onerror = () => console.log('file reading has failed');
    reader.onload = () => {
      const binaryStr = reader.result;
      setPreimage(binaryStr);
      console.log(binaryStr);
    };
    reader.readAsArrayBuffer(file);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  console.log(api.tx.democracy.notePreimage);
  return (
    <Modal open={isOpen} onOpen={() => setOpen(true)}
      trigger={<Button className="green">New Preimage</Button>}
    >
      <Modal.Header>
        Propose Runtime Upgrade
      </Modal.Header>
      <Modal.Content>

        <h3>Upload new runtime:</h3>
        <div className={classNames('file-drop', { 'drag-active': isDragActive })} {...getRootProps()}>
          <input {...getInputProps()} />
          Drag and drop file here or click to upload
        </div>

      </Modal.Content>
      <Modal.Actions>
        <Button className="red" onClick={setClose}>Cancel</Button>
        <TxButton
          label='Submit Preimage'
          type='SIGNED-TX'
          accountPair={accountPair}
          setStatus={(e) => console.log(e)}
          attrs={{
            palletRpc: 'democracy',
            callable: 'notePreimage',
            inputParams: [proposal?.method.toHex()],
            paramFields: [{ name: 'proposal', type: 'Bytes', optional: false }],
            interxType: 'EXTRINSIC',
            disabled: proposal == null
          }}
          // tx={api.tx.democracy.notePreimage}
        />
      </Modal.Actions>
    </Modal>
  );
};

const Democracy = ({ accountPair }) => {
  const { api } = useSubstrate();
  const [proposals, setProposals] = useState([]);
  const [referendums, setReferendums] = useState([]);
  useEffect(() => {
    api.derive.democracy.proposals().then(p => {
      console.log('proposals are:', p);
      setProposals(p);
    });
  }, [api, setProposals]);
  useEffect(() => {
    api.derive.democracy.referendums().then(r => {
      console.log('referendums are:', r);
      setReferendums(r);
    });
  }, [api, setReferendums]);
  return (
    <div className="w-full democracy-container">
      <h2 className="header referenda-header">Active Referenda</h2>
      <div className="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Proposals</h2>
          <NewProposalModal accountPair={accountPair}/>
      </div>

      {proposals.map((proposal, i) => {
        return <ProposalRow key={i} imageHash={proposal.imageHash} proposer={proposal.proposer}/>;
      })}
      <ProposalRow />
      <ProposalRow />
      <ProposalRow />

      <div class="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Preimages</h2>
          <NewPreimageModal accountPair={accountPair}/>
      </div>
    </div>
  );
};

export default Democracy;
