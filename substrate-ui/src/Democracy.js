import React, { useState } from 'react';
import { Button, Modal } from 'semantic-ui-react';
import './Democracy.css';

const ProposalRow = () => {
  return (
    <div className="proposal-card">
      <span>Proposal Name</span>
      <button className="ui button">second</button>
    </div>
  );
};

const NewProposalModal = () => {
  const [isOpen, setOpen] = useState(false);
  return (
    <Modal open={isOpen} onOpen={() => setOpen(true)}
      trigger={<Button className="green">New Proposal</Button>}
    >
      <Modal.Header>
        Propose Runtime Upgrade
      </Modal.Header>
      <Modal.Content>

        <h3>Upload new runtime:</h3>

        <Button className="red" onClick={() => setOpen(false)}>Cancel</Button>
        <Button className="blue">Sign and submit</Button>
      </Modal.Content>
    </Modal>
  );
};

const Democracy = () => {
  return (
    <div className="w-full democracy-container">
      <h2 className="header referenda-header">Active Referenda</h2>
      <div class="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Proposals</h2>
          <NewProposalModal/>
      </div>

      <ProposalRow />
      <ProposalRow />
      <ProposalRow />

      <div class="ui divider w-full"></div>
    </div>
  );
};

export default Democracy;
