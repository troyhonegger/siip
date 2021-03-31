#!/usr/bin/env bash

# Get the head block of the blockchain

curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d   '{
     "jsonrpc":"2.0",
      "id":1,
      "method":"chain_getFinalizedHead",
      "params": []
    }'

