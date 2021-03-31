#!/usr/bin/env bash

curl http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d   '{
     "jsonrpc":"2.0",
      "id":1,
      "method":"rpc_methods",
      "params": []
    }'

