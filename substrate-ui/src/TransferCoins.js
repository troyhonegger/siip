import React, { useState } from 'react';
import './css/Siip.css';
import { Field, Static } from './SiipCommon';

export default function TransferCoins (props) {
  const criteriaString = (isNum, validSign) => {
    console.log('validSign is: ' + validSign);

    let newCriteria = '';
    if (isNum) {
      newCriteria += 'Ok: The number must be correctly formatted\n';
    } else {
      newCriteria += 'Err: The number must be correctly formatted\n';
    }

    if (validSign) {
      newCriteria += 'Ok: The number must have the correct sign (positive or negative)\n';
    } else {
      newCriteria += 'Err: The number must have the correct sign (positive or negative)\n';
    }

    return newCriteria;
  };

  const [sndrAddr, setSndrAddr] = useState('');
  const [sndrName, setSndrName] = useState('');
  const [sndrStart, setSndrStart] = useState(0);
  const [sndrDelta, setSndrDelta] = useState('');
  const [sndrDeltaCrit, setSndrDeltaCrit] = useState(criteriaString(false, false));
  const [sndrEnd, setSndrEnd] = useState('');
  const [sndrEndCrit, setSndrEndCrit] = useState(criteriaString(false, false));

  const [rcptAddr, setRcptAddr] = useState('');
  const [rcptAddrCrit, setRcptAddrCrit] = useState('');
  const [rcptName, setRcptName] = useState('');
  const [rcptStart, setRcptStart] = useState(0);
  const [rcptDelta, setRcptDelta] = useState('');
  const [rcptDeltaCrit, setRcptDeltaCrit] = useState(criteriaString(false, false));
  const [rcptEnd, setRcptEnd] = useState('');
  const [rcptEndCrit, setRcptEndCrit] = useState(criteriaString(false, false));

  const [amount, setAmount] = useState(0);
  const [valid, setValid] = useState(false);

  const updateSndrDelta = (event) => {
    const input = event.target.value;
    setSndrDelta(input);

    const amount = -parseFloat(input);
    if (input.slice(-1) !== '.') {
      updateAmount(amount);
    }

    const num = parseFloat(input);
    setSndrDeltaCrit(criteriaString(!isNaN(num), num <= 0));
  };

  const updateSndrEnd = (event) => {
    const input = event.target.value;
    setSndrEnd(input);

    const amount = -(parseFloat(input) - sndrStart);
    if (input.slice(-1) !== '.') {
      updateAmount(amount);
    }

    const num = parseFloat(input);
    setSndrEndCrit(criteriaString(!isNaN(num), num >= 0));
  };

  const updateRcptDelta = (event) => {
    const input = event.target.value;
    setRcptDelta(input);

    const amount = parseFloat(input);
    if (input.slice(-1) !== '.') {
      updateAmount(amount);
    }

    const num = parseFloat(input);
    setRcptDeltaCrit(criteriaString(!isNaN(num), num >= 0));
  };

  const updateRcptEnd = (event) => {
    const input = event.target.value;
    setRcptEnd(input);

    const amount = parseFloat(input) - rcptStart;
    if (input.slice(-1) !== '.') {
      updateAmount(amount);
    }

    const num = parseFloat(input);
    setRcptEndCrit(criteriaString(!isNaN(num), num >= 0));
  };

  const updateRcptAddr = (event) => {
    const input = event.target.value;
    setRcptAddr(input);
  };

  const updateAmount = (newAmount) => {
    if (isNaN(newAmount) || newAmount < 0) {
      return;
    }
    setSndrDelta((-newAmount).toString());
    setRcptDelta(newAmount.toString());
    setSndrEnd((sndrStart - newAmount).toString());
    setRcptEnd((rcptStart + newAmount).toString());

    setSndrDeltaCrit(criteriaString(true, true));
    setSndrEndCrit(criteriaString(true, true));
    setRcptDeltaCrit(criteriaString(true, true));
    setRcptEndCrit(criteriaString(true, true));

    setAmount(newAmount);
  };

  const updateValid = () => {
    if (sndrDeltaCrit.includes('Err: ') ||
      sndrEndCrit.includes('Err: ') ||
      rcptAddrCrit.includes('Err: ') ||
      rcptDeltaCrit.includes('Err: ') ||
      rcptEndCrit.includes('Err: ')) {
      setValid(false);
    } else {
      setValid(true);
    }
  };

  return (
    <div className='row'>
      <div className='column'>
        <div className='card'>
          <h3>
            Sender
          </h3>
          <Static
            label='Your address:'
            value={sndrAddr}
          />
          <Static
            label='Your name:'
            value={sndrName}
          />
          <Static
            label='Starting balance'
            value={sndrStart}
          />
          <Field
            label='Delta:'
            value={sndrDelta}
            onChange={updateSndrDelta}
            criteria={sndrDeltaCrit}
            alwaysValidate={true}
            enable={true}
          />
          <Field
            label='Ending balance'
            value={sndrEnd}
            onChange={updateSndrEnd}
            criteria={sndrEndCrit}
            alwaysValidate={true}
            enable={true}
          />
        </div>
      </div>
      <div className='column'>
        <div className='card'>
          <h3>
            Recipient
          </h3>
          <Field
            label='Their address:'
            value={rcptAddr}
            onChange={updateRcptAddr}
            criteria={rcptAddrCrit}
            enable={true}
          />
          <Static
            label='Their name:'
            value={rcptName}
          />
          <Static
            label='Starting balance'
            value={rcptStart}
          />
          <Field
            label='Delta:'
            value={rcptDelta}
            onChange={updateRcptDelta}
            criteria={rcptDeltaCrit}
            alwaysValidate={true}
            enable={true}
          />
          <Field
            label='Ending balance'
            value={rcptEnd}
            onChange={updateRcptEnd}
            criteria={rcptEndCrit}
            alwaysValidate={true}
            enable={true}
          />
        </div>
      </div>
    </div>
  );
}
