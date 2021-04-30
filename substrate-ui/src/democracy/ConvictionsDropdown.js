import BN from 'bn.js';
import React, { useRef } from 'react';

import { useBlockTime } from '@polkadot/react-hooks';

import Dropdown from './Dropdown';
const CONVICTIONS = [1, 2, 4, 8, 16, 32].map((lock, index) => [index + 1, lock, new BN(lock)]);
const SEC_DAY = 60 * 60 * 24;
const BN_THOUSAND = new BN(1000);

function createOptions (api, blockTime) {
  return [
    { text: '0.1x voting balance, no lockup period', value: 0 },
    ...CONVICTIONS.map(([value, lock, bnLock]) => {
      const period = (bnLock.mul(api.consts.democracy.enactmentPeriod.muln(blockTime).div(BN_THOUSAND)).toNumber() / SEC_DAY).toFixed(2);
      return ({
        text: `${value}x voting balance, locked for ${lock}x enactment (${period} days)`,
        value
      });
    })
  ];
}

function Convictions ({ className = '', help, label, onChange, value }) {
  const { api } = useApi();
  const [blockTime] = useBlockTime();

  const optionsRef = useRef(createOptions(api, blockTime));

  return (
    <Dropdown
      className={className}
      help={help}
      label={label}
      onChange={onChange}
      options={optionsRef.current}
      value={value}
    />
  );
}

export default React.memo(Convictions);
