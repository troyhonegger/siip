import React, { useEffect } from 'react';
import { useSubstrate } from '../substrate-lib';

import PreimageModal from './PreimageModal';
import ProposalModal from './ProposalModal';
import './Democracy.css';
import { byteArrToHexString } from '../utils';
import { useCall } from './useCall';

const ProposalRow = ({ imageHash, proposer }) => {
  return (
    <div className="proposal-card">
      <div>
        <span>Image Hash: </span> {imageHash && byteArrToHexString(imageHash)}
      </div>
      <br></br>
      <div>
        <span> Proposer: </span> {proposer && byteArrToHexString(proposer)}
      </div>
      <button className="ui button">second</button>
    </div>
  );
};

const Democracy = ({ accountPair }) => {
  const { api } = useSubstrate();
  window.api = api;
  const proposals = useCall(api.derive.democracy.proposals);
  const referendums = useCall(api.derive.democracy.referendums);
  useEffect(() => console.log(referendums), [referendums]);
  return (
    <div className="w-full democracy-container">
      <h2 className="header referenda-header">Active Referenda</h2>
      <div className="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Proposals</h2>
          <ProposalModal accountPair={accountPair}/>
      </div>

      {proposals?.map((proposal, i) => {
        return <ProposalRow key={i} imageHash={proposal.imageHash} proposer={proposal.proposer}/>;
      })}

      <div class="ui divider w-full"></div>
      <div className="w-full split-title">
          <h2 className="header">Preimages</h2>
          <PreimageModal accountPair={accountPair}/>
      </div>
    </div>
  );
};

export default Democracy;
