import React, { useState } from 'react';
import './css/Siip.css';
import { Field, Static } from './SiipCommon';
import { TxButton } from './substrate-lib/components';
import { Form } from 'semantic-ui-react';

const unit = 1_000_000_000_000;

export default function TransferCoins (props) {
  const criteriaString = (isNum, validSign) => {
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
  const [sndrDelta, setSndrDelta] = useState('0');
  const [sndrDeltaCrit, setSndrDeltaCrit] = useState(criteriaString(true, true));
  const [sndrEnd, setSndrEnd] = useState('0');
  const [sndrEndCrit, setSndrEndCrit] = useState(criteriaString(true, true));

  const [rcptAddr, setRcptAddr] = useState('');
  const [rcptAddrCrit, setRcptAddrCrit] = useState('');
  const [rcptName, setRcptName] = useState('');
  const [rcptStart, setRcptStart] = useState(0);
  const [rcptDelta, setRcptDelta] = useState('0');
  const [rcptDeltaCrit, setRcptDeltaCrit] = useState(criteriaString(true, true));
  const [rcptEnd, setRcptEnd] = useState('0');
  const [rcptEndCrit, setRcptEndCrit] = useState(criteriaString(true, true));

  const [amount, setAmount] = useState(0);
  // const [valid, setValid] = useState(false);

  const [status, setStatus] = useState('');

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

    // 1 unit is 1 000 000 000 000
    setAmount(Math.round(newAmount * unit).toString());
  };

  const isValid = () => {
    if (sndrDeltaCrit.includes('Err: ') ||
      sndrEndCrit.includes('Err: ') ||
      rcptAddrCrit.includes('Err: ') ||
      rcptDeltaCrit.includes('Err: ') ||
      rcptEndCrit.includes('Err: ')) {
      return false;
    } else {
      return true;
    }
  };

  const updateStarting = (from, to) => {
    const ok = 'Ok: Must be a valid address\n';
    const err = 'Err: Must be a valid address\n';

    if (typeof api === 'undefined') {
      return;
    }

    // Updates sender starting
    // eslint-disable-next-line
    api.query.system.account(from, balance => {
      const starting = balance.data.free / unit;

      if (sndrStart !== starting) {
        setSndrStart(starting);
        setSndrEnd(starting - amount / unit);
      }
    });

    // Updates recipient starting
    // eslint-disable-next-line
    api.query.system.account(to, balance => {
      const starting = balance.data.free / unit;

      if (rcptStart !== starting) {
        setRcptStart(starting);
        setRcptEnd(starting + amount / unit);
      }
      if (rcptAddrCrit !== ok) {
        setRcptAddrCrit(ok);
      }
      // eslint-disable-next-line
    }).catch((error) => {
      if (rcptAddrCrit !== err) {
        setRcptAddrCrit(err);
      }
    });
  };

  const updateName = (from, to) => {
    // const ok = 'Ok: Must be a valid address\n';
    // const err = 'Err: Must be a valid address\n';

    // keyring.getPairs().forEach(account => {
    //   console.log('account: ');
    //   console.log(account);
    // }
    // api.query.system.account(from, name => {
    //   console.log('name is: ' + name);
    // }).catch((error) => {
    //   console.log('Error when finding the name of the account:');
    //   console.log(error);
    // });

    console.log('Figure out a way to update the name');

    if (sndrName !== 'TODO') {
      setSndrName('TODO');
    }
    if (rcptName !== 'TODO') {
      setRcptName('TODO');
    }
  };

  // Updates the sender address
  if (props.accountPair != null) {
    const addr = props.accountPair.address;
    if (addr !== sndrAddr) {
      // Update sender address
      setSndrAddr(addr);
    }
  }

  // Updates the starting amounts
  updateStarting(sndrAddr, rcptAddr);
  updateName(sndrAddr, rcptAddr);

  const columnize = (sender, recipient) => {
    return (
      <div className='row'>
        <div className='column'>
          {sender}
        </div>
        <div className='column'>
          {recipient}
        </div>
      </div>
    );
  };

  return (
    <div className='card'>
      {columnize(
        <h3>
          Sender
        </h3>,
        <h3>
          Recipient
        </h3>
      )}
      {columnize(
        <Static
          label='Your address:'
          value={sndrAddr}
        />,
        <Field
          label='Their address:'
          value={rcptAddr}
          onChange={updateRcptAddr}
          criteria={rcptAddrCrit}
          alwaysValidate={true}
          enable={true}
        />
      )}
      {columnize(
        <Static
          label='Your name:'
          value={sndrName}
        />,
        <Static
          label='Their name:'
          value={rcptName}
        />
      )}
      {columnize(
        <Static
          label='Starting balance'
          value={sndrStart}
        />,
        <Static
          label='Starting balance'
          value={rcptStart}
        />
      )}
      {columnize(
        <Field
          label='Delta:'
          value={sndrDelta}
          onChange={updateSndrDelta}
          criteria={sndrDeltaCrit}
          alwaysValidate={true}
          enable={true}
        />,
        <Field
          label='Delta:'
          value={rcptDelta}
          onChange={updateRcptDelta}
          criteria={rcptDeltaCrit}
          alwaysValidate={true}
          enable={true}
        />
      )}
      {columnize(
        <Field
          label='Ending balance'
          value={sndrEnd}
          onChange={updateSndrEnd}
          criteria={sndrEndCrit}
          alwaysValidate={true}
          enable={true}
        />,
        <Field
          label='Ending balance'
          value={rcptEnd}
          onChange={updateRcptEnd}
          criteria={rcptEndCrit}
          alwaysValidate={true}
          enable={true}
        />
      )}
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={props.accountPair}
          label='Submit'
          type='SIGNED-TX'
          setStatus={setStatus}
          attrs={{
            palletRpc: 'balances',
            callable: 'transfer',
            inputParams: [rcptAddr, amount],
            paramFields: [true, true]
          }}
          disabled={!isValid()}
        />
        <p>
          {status}
        </p>
      </Form.Field>
    </div>
  );
}
