import React, {useEffect, useState} from 'react';
import {Grid, Statistic, Card, Button, Modal} from 'semantic-ui-react';
import {useSubstrate} from './substrate-lib';

import BlockNumber from './BlockNumber';
import TextareaAutosize from "react-autosize-textarea";

var search_block_number = 0;

async function printBlockHeader() {
    var num = window.prompt("Enter block number: ");

    const blockHash = await api.rpc.chain.getBlockHash(num);
    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    window.alert("Block Number " + num + " Header\n\n" + signedBlock.block.header.toString());
    return (signedBlock.block.header.toString());
}
function SearchBlockNum (props) {
    const [isFocused, setFocused] = useState(false);

    return (
        <div>
            <label>Search Block Number:</label>
            <div>
                <TextareaAutosize
                    style={{ width: width }}
                    className="input_field"
                    placeholder={props.placeholder}
                    value={props.value}
                    onChange={props.onChange}
                    onFocus={(e) => {
                        setFocused(true);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                    }}
                />
            </div>
        </div>
    );
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

    const updateSearchBlockNum = (event) => {
        const num = event.target.value;
        search_block_number = num;
    };

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
                        <Button onClick={() => printBlockHeader()}>Get Block Header</Button>
                    </Card.Content>
                </Card>
            </Grid.Column>

            <Grid.Column>
                <Card>
                    <Card.Content textAlign='center'>
                        <Statistic
                            label={'Block'}
                            value={getBlockNumValue(blockNumber - 2)}
                        />
                    </Card.Content>
                </Card>
            </Grid.Column>

            <Grid.Column>
                <Card>
                    <Card.Content textAlign='center'>
                        <Statistic
                            label={'Block'}
                            value={getBlockNumValue(blockNumber - 1)}
                        />
                    </Card.Content>
                </Card>
            </Grid.Column>

            <Grid.Column>
                <Card>
                    <Card.Content textAlign='center'>
                        <Statistic
                            value={getBlockNumValue(blockNumber)}
                            label={'Block Number'}
                        />
                    </Card.Content>
                </Card>
            </Grid.Column>
        </Grid>
    );
}