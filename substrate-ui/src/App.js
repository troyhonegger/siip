import React, { useState, createRef } from 'react';
import { Container, Dimmer, Loader, Grid, Sticky, Message } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom';
import './utilities.css';

import { SubstrateContextProvider, useSubstrate } from './substrate-lib';
import { DeveloperConsole } from './substrate-lib/components';
import AccountSelector from './AccountSelector';
import Balances from './Balances';
import BlockNumber from './BlockNumber';
import Events from './Events';
import Interactor from './Interactor';
import Metadata from './Metadata';
import NodeInfo from './NodeInfo';
import TemplateModule from './TemplateModule';
// import Transfer from './Transfer';
// import Upgrade from './Upgrade';
import TransferCoins from './TransferCoins';
// import Metrics from "./Metrics";
// import Chain from "./Chain";
import GettersAndSetters from './GettersAndSetters';
import Democracy from './democracy';
import { BALANCES_PATH, DEMOCRACY_PATH, INTERACTOR_PATH, METRICS_PATH, SIIP_PATH } from './routes';

function Main () {
  const [accountAddress, setAccountAddress] = useState(null);
  const { apiState, keyring, keyringState, apiError } = useSubstrate();
  const accountPair =
    accountAddress &&
    keyringState === 'READY' &&
    keyring.getPair(accountAddress);

  const loader = text =>
    <Dimmer active>
      <Loader size='small'>{text}</Loader>
    </Dimmer>;

  const message = err =>
    <Grid centered columns={2} padded>
      <Grid.Column>
        <Message negative compact floating
                 header='Error Connecting to Substrate'
                 content={`${JSON.stringify(err, null, 4)}`}
        />
      </Grid.Column>
    </Grid>;

  if (apiState === 'ERROR') return message(apiError);
  else if (apiState !== 'READY') return loader('Connecting to Substrate');

  if (keyringState !== 'READY') {
    return loader('Loading accounts (please review any extension\'s authorization)');
  }

  const contextRef = createRef();

  return (
    <Router>
      <div ref={contextRef}>
        <Sticky context={contextRef}>
          <AccountSelector setAccountAddress={setAccountAddress}/>
        </Sticky>
        <Container>
          <Grid stackable columns='equal'>
            <Switch>
              <Route path={METRICS_PATH}>
                <Grid.Row stretched>
                  <NodeInfo/>
                  <Metadata/>
                  <BlockNumber/>
                  <BlockNumber finalized/>
                </Grid.Row>
              </Route>
              <Route path={DEMOCRACY_PATH}>
                <Democracy accountPair={accountPair} />
              </Route>
              <Route path={SIIP_PATH}>
                <Grid.Row>
                  <GettersAndSetters accountPair={accountPair}/>
                </Grid.Row>
              </Route>
              <Route path={BALANCES_PATH}>
                <Grid.Row>
                  <TransferCoins accountPair={accountPair}/>
                </Grid.Row>
                <Grid.Row stretched>
                  <Balances/>
                </Grid.Row>
              </Route>
              <Route path={INTERACTOR_PATH}>
                <Grid.Row>
                  <Interactor accountPair={accountPair}/>
                  <Events/>
                </Grid.Row>
              </Route>
              <Route path="/">
                <Redirect to={SIIP_PATH}></Redirect>
              </Route>
            </Switch>
            {/* <Grid.Row> */}
            {/* <Transfer accountPair={accountPair} /> */}
            {/* <Upgrade accountPair={accountPair} /> */}
            {/* </Grid.Row> */}
            <Grid.Row>
              <TemplateModule accountPair={accountPair}/>
            </Grid.Row>
          </Grid>
        </Container>
        <DeveloperConsole/>
      </div>
    </Router>
  );
}

export default function App () {
  return (
    <SubstrateContextProvider>
      <Main/>
    </SubstrateContextProvider>
  );
}
