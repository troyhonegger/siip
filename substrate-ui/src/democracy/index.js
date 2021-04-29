import React from 'react';
import { useSubstrate } from '../substrate-lib';

import PreimageModal from './PreimageModal';
import ProposalModal from './ProposalModal';
import './Democracy.css';
import { useCall } from './useCall';
import classNames from 'classnames';
import { Icon } from 'semantic-ui-react';
import VoteModal from './VoteModal';
import { TxButton } from '../substrate-lib/components';

const ProposalRow = ({ accountPair, proposal }) => {
  window.proposal = proposal;
  return (
    <div className="proposal-card">
      <div className="proposal-left-half">
        <div className="proposal-detail">
          <span className="proposal-label">Image Hash: </span>
          <span className="ellipsis"> {proposal?.imageHash?.toHuman()}</span>
        </div>
        <div className="proposal-detail">
          <span className="proposal-label"> Proposer: </span>
          <span className="ellipsis"> {proposal?.proposer?.toHuman()}</span>
        </div>
        <div className="proposal-detail">
          <span className="proposal-label"> Locked Balance: </span>
          <span className="ellipsis"> {proposal?.balance?.toHuman()}</span>
        </div>
        <div className="proposal-detail">
          <span className="proposal-label"> Seconds: </span>
          <span className="ellipsis"> {proposal?.seconds?.length}</span>
        </div>
      </div>
      <TxButton
        label='Second'
        type='SIGNED-TX'
        accountPair={accountPair}
        setStatus={() => {}}
        disabled={false}
        attrs={{
          palletRpc: 'democracy',
          callable: 'second',
          inputParams: [proposal?.index, '100'], // don't bother to second a proposal with more than 100 seconds
          paramFields: [{ name: 'proposal', type: 'Compact<PropIndex>' }, { name: 'secondsUpperBound', type: 'Compact<u32>' }],
          interxType: 'EXTRINSIC',
          disabled: false
        }}
      />
    </div>
  );
};

const ReferendumRow = ({ accountPair, referendum }) => {
  return (
    <>
    <div className={classNames('referendum-card', { 'is-passing': referendum.isPassing })}>
      <div className="referendum-card-title">
        Referendum {referendum.index.toHuman()}
      </div>
      <div className="referendum-body">
        <div className="referendum-left-half">
          <div className="referendum-detail">
            <span className="referendum-label">Preimage Hash:</span>
            <span className="ellipsis"> {referendum?.imageHash?.toHuman()}</span>
          </div>
          <div className="referendum-votes">
            <div>
              <div>
                <span className="referendum-label">Ayes:</span> {referendum.votedAye.toHuman()}
              </div>
              <div>
                <span className="referendum-label">Nays:</span> {referendum.votedNay.toHuman()}
              </div>
            </div>
            <div className="vote-summary-icon">
              <Icon className={`large ${referendum.isPassing ? 'check green' : 'ban red'}`}/>
            </div>
          </div>
        </div>
        <div className="referendum-right-half">
          <VoteModal accountPair={accountPair} referendum={referendum}/>
        </div>
      </div>
    </div>
    </>
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
        <ReferendumRow accountPair={accountPair} referendum={referendum} key={referendum.index.toString()}/>
      )}
      <div className="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Proposals</h2>
          <ProposalModal accountPair={accountPair}/>
      </div>

      {proposals?.map((proposal) => {
        return <ProposalRow accountPair={accountPair} key={proposal.index.toString()} proposal={proposal}/>;
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
