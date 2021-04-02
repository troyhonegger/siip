#!/usr/bin/env bash

# Tests the various scripts in this client package.
# Make sure you have a development node running with:
# cargo run --release -- --dev --tmp

echo "Registering Test.com: 1.1.1.1 12:12:12"
./register.py 'test.com' 'test' '1.1.1.1' '{}' '121212'
./plow.py 'test.com'
