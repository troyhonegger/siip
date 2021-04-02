import React, {useEffect, useState} from 'react';
import {Grid, Statistic, Card, Button} from 'semantic-ui-react';
import {useSubstrate} from './substrate-lib';

import BlockNumber from './BlockNumber';
import {max} from "@popperjs/core/lib/utils/math";

async function printBlockHeader(maxBlockNum) {
    var num = window.prompt("Enter block number: ");

    if(num < 0 || num > maxBlockNum){
        window.alert("Entry must be greater than 0 and less than " + maxBlockNum);
    }
    else {
        const blockHash = await api.rpc.chain.getBlockHash(num);
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        window.alert("Block Number " + num + " Header\n\n" + signedBlock.block.header.toString());
    }
}

function getBlockNumValue(num){
    if(num > 0){
        return num;
    }
    else{
        return "-";
    }
}


export default function Main(props) {
    const {api, keyring} = useSubstrate();
    const accounts = keyring.getPairs();
    const [balances, setBalances] = useState({});
    const [blockNumber, setBlockNumber] = useState(0);
    const [blockNumberTimer, setBlockNumberTimer] = useState(0);
    const bestNumber = api.derive.chain.bestNumber;

    useEffect(() => {
        const addresses = keyring.getPairs().map(account => account.address);
        let unsubscribeAll = null;
        api.query.system.account
            .multi(addresses, balances => {
                const balancesMap = addresses.reduce((acc, address, index) => ({
                    ...acc, [address]: balances[index].data.free.toHuman()
                }), {});
                setBalances(balancesMap);
            }).then(unsub => {
            unsubscribeAll = unsub;
        }).catch(console.error);

        return () => unsubscribeAll && unsubscribeAll();
    }, [api, keyring, setBalances]);

    useEffect(() => {
        let unsubscribeAll = null;

        bestNumber(number => {
            setBlockNumber(number.toNumber());
            setBlockNumberTimer(0);
        })
            .then(unsub => {
                unsubscribeAll = unsub;
            })
            .catch(console.error);

        return () => unsubscribeAll && unsubscribeAll();
    }, [bestNumber]);

    return (
        <Grid stackable columns='equal'>
            <Grid.Column>
                <Card>
                    <Card.Content textAlign='center'>
                        <Button onClick={() => printBlockHeader(blockNumber)}>Search For Block Header</Button>
                        <br />
                        <br />
                        <br />
                    </Card.Content>
                </Card>
            </Grid.Column>

            <Grid.Column>
                <Card>
                    <Card.Content textAlign='center'>
                        <Statistic
                            label={'Block Number'}
                            value={getBlockNumValue(blockNumber - 2)}
                        />
                    </Card.Content>
                </Card>
            </Grid.Column>

            <Grid.Column>
                <Card>
                    <Card.Content textAlign='center'>
                        <Statistic
                            label={'Block Number'}
                            value={getBlockNumValue(blockNumber - 1)}
                        />
                    </Card.Content>
                </Card>
            </Grid.Column>

            <Grid.Column>
                <Card>
                    <Card.Content textAlign='center'>
                        <Statistic
                            label={'Block Number'}
                            value={getBlockNumValue(blockNumber)}
                        />
                    </Card.Content>
                </Card>
            </Grid.Column>
        </Grid>
    );
}