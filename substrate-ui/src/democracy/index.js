import React from 'react';
import { useSubstrate } from '../substrate-lib';

import PreimageModal from './PreimageModal';
import ProposalModal from './ProposalModal';
import './Democracy.css';
import { useCall } from './useCall';
import classNames from 'classnames';
import { Button } from 'semantic-ui-react';

const ProposalRow = ({ proposal }) => {
  return (
    <div className="proposal-card">
      <div>
        <div className="proposal-detail">
          <span className="proposal-label">Image Hash: </span> {proposal?.imageHash?.toHuman()}
        </div>
        <div className="proposal-detail">
          <span className="proposal-label"> Proposer: </span> {proposal?.proposer?.toHuman()}
        </div>
        <div className="proposal-detail">
          <span className="proposal-label"> Locked Balance: </span> {proposal?.balance?.toHuman()}
        </div>
      </div>
      <button className="ui button blue">second</button>
    </div>
  );
};

const ReferendumRow = ({ referendum }) => {
  return (
    <div className={classNames('referendum-card', { 'is-passing': referendum.isPassing })}>
      <div className="referendum-left-half">
        <div>
          <span className="referendum-label">Preimage Hash:</span> {referendum?.imageHash?.toHuman()}
        </div>
        <div>
          <span className="referendum-label">Ayes:</span> {referendum.voteCountAye}
        </div>
        <div>
          <span className="referendum-label">Nays:</span> {referendum.voteCountNay}
        </div>
      </div>
      <div className="referendum-right-half">
        <Button color="blue">Vote</Button>
      </div>
    </div>
  );
};

const Democracy = ({ accountPair }) => {
  const { api } = useSubstrate();
  const proposals = useCall(api.derive.democracy.proposals);
  const referendums = useCall(api.derive.democracy.referendums);

  return (
    <div className="w-full democracy-container">
      <h2 className="header referenda-header">Active Referendums</h2>
      {referendums?.map((referendum) =>
        <ReferendumRow referendum={referendum} key={referendum.index.toString()}/>
      )}
      <div className="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Proposals</h2>
          <ProposalModal accountPair={accountPair}/>
      </div>

      {proposals?.map((proposal) => {
        return <ProposalRow key={proposal.index.toString()} proposal={proposal}/>;
      })}

      <div className="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Preimages</h2>
          <PreimageModal accountPair={accountPair}/>
      </div>
    </div>
  );
};

export default Democracy;
