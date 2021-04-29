import React, {useEffect, useState} from 'react';
import {Grid, Button, Card, Modal} from 'semantic-ui-react';

import {useSubstrate} from './substrate-lib';

async function openMetrics() {
    window.open('http://localhost:9615/metrics')
}

export default function Main(props) {
    const {api} = useSubstrate();
    const [metadata, setMetadata] = useState({data: null, version: null});

    useEffect(() => {
        const getMetadata = async () => {
            try {
                const data = await api.rpc.state.getMetadata();
                setMetadata({data, version: data.version});
            } catch (e) {
                console.error(e);
            }
        };
        getMetadata();
    }, [api.rpc.state]);

    return (
        <Grid.Column>
            <Card>
                <Card.Content>
                    <Card.Header>Metrics</Card.Header>
                </Card.Content>
                <Card.Content extra>
                    <Button onClick={() => openMetrics()}>Show metrics</Button>
                </Card.Content>
            </Card>
        </Grid.Column>
    );
}