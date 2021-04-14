import React, { useState, useEffect } from 'react';
import './css/Siip.css';
import TextareaAutosize from 'react-autosize-textarea';
import { TxButton } from './substrate-lib/components';
import { Button } from 'semantic-ui-react';
import { SubmitButton, Validation, Field, Static } from './SiipCommon';

export default function TransferCoins (props) {
  //{sndr, rcpt} x {Addr, Name, Start, Delta, End}
  const [sndrAddr, setSndrAddr] = useState('');
  const [sndrName, setSndrName] = useState('');
  const [sndrStart, setSndrStart] = useState(0);

  const [sndrDelta, setSndrDelta] = useState('');
  useEffect(() => {
    console.log('sndDelta is: ' + sndrDelta);
    updateAmount(-parseFloat(sndrDelta));
    validateNumbers();
  });

  const [sndrEnd, setSndrEnd] = useState('');
  useEffect(() => {
    updateAmount(-(parseFloat(sndrEnd) - sndrStart));
    validateNumbers();
  });

  const [rcptAddr, setRcptAddr] = useState('');
  const [rcptName, setRcptName] = useState('');
  const [rcptStart, setRcptStart] = useState(0);

  const [rcptDelta, setRcptDelta] = useState('');
  useEffect(() => {
    updateAmount(parseFloat(rcptDelta));
    validateNumbers();
  });

  const [rcptEnd, setRcptEnd] = useState('');
  useEffect(() => {
    updateAmount(parseFloat(rcptEnd) - rcptStart);
    validateNumbers();
    console.log('You buffoon. useEffect get\'s run after every render. Go back to update functions, and pass all 4 params to validateNumbers()');
  });

  const [amount, setAmount] = useState(0);
  const [numCriteria, setNumCriteria] = useState('');
  const [addrCriteria, setAddrCriteria] = useState('');
  const [valid, setValid] = useState(false);

  const updateRcptAddr = (event) => {
    let input = event.target.value;
    setRcptAddr(input);
  }

  const updateAmount = (newAmount) => {
    if (isNaN(newAmount)) {
      return;
    }
    setSndrDelta((-newAmount).toString());
    setRcptDelta(newAmount.toString());
    setSndrEnd((sndrStart - newAmount).toString());
    setRcptEnd((rcptStart + newAmount).toString());
  }

  const validateNumbers = () => {
    let newCriteria = '';
    //All values must be valid numbers
    if (isNaN(parseFloat(sndrDelta)) ||
      isNaN(parseFloat(sndrEnd)) ||
      isNaN(parseFloat(rcptDelta)) ||
      isNaN(parseFloat(rcptEnd))) {
      console.log('Something is NaN');
      console.log('sndrDelta: ' + sndrDelta);
      console.log('sndrEnd: ' + sndrEnd);
      console.log('rcptDelta: ' + rcptDelta);
      console.log('rcptEnd: ' + rcptEnd);
      newCriteria += 'Err: All numbers must be correctly formatted\n';
    } else {
      console.log('Everything is not NaN');
      console.log('sndrDelta: ' + sndrDelta);
      console.log('sndrEnd: ' + sndrEnd);
      console.log('rcptDelta: ' + rcptDelta);
      console.log('rcptEnd: ' + rcptEnd);
      newCriteria += 'Ok: All numbers must be correctly formatted\n';
    }

    //All values must have the correct sign
    if ((sndrDelta >= 0) ||
      (sndrEnd < 0) ||
      (rcptDelta <= 0) ||
      (rcptEnd < 0)) {
      newCriteria += 'Err: Invalid sign of a number\n';
    } else {
      newCriteria += 'Ok: Invalid sign of a number\n';
    }

    setNumCriteria(newCriteria);
  }

  const updateValid = () => {
    if (numCriteria.includes('Err:') || addrCriteria.includes('Err:')) {
      setValid(false);
    } else {
      setValid(true);
    }
  }

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
            label='You will send:'
            value={sndrDelta}
            // onChange={(event) => {setSndrDelta(event.target.value)}}
            onChange={(event) => {console.log(event.target.value);setSndrDelta(event.target.value)}}
            criteria={numCriteria}
            enable={true}
          />
          <Field
            label='Ending balance'
            value={sndrEnd}
            onChange={(event) => {setSndrEnd(event.target.value)}}
            criteria={numCriteria}
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
            onChange={(event) => {setRcptAddr(event.target.value)}}
            criteria={addrCriteria}
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
            label='They will receive:'
            value={rcptDelta}
            onChange={(event) => {setRcptDelta(event.target.value)}}
            criteria={numCriteria}
            enable={true}
          />
          <Field
            label='Ending balance'
            value={rcptEnd}
            onChange={(event) => {setRcptEnd(event.target.value)}}
            criteria={numCriteria}
            enable={true}
          />
        </div>
      </div>
    </div>
  );
}

