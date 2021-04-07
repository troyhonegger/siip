#!/usr/bin/env bash

# Tests the various scripts in this client package.
# Make sure you have a development node running with:
# cargo run --release -- --dev --tmp

echo -n "Testing plow on non-existent domain..."
./remove.py 'test.com' >/dev/null
./plow.py 'test.com' >/dev/null
if [ $? -eq 1 ]; then
    echo "PASS"
else
    echo "FAIL"
fi

echo -n "Testing registering domain with missing info should fail..."
./register.py 'test.com' 'test' '1.1.1.1' >/dev/null
./plow.py 'test.com' >/dev/null
if [ $? -eq 1 ]; then
    echo "PASS"
else
    echo "FAIL"
fi

echo -n "Testing registering domain with malformed info should fail..."
./register.py 'test.com' 'test' '1.1.1.1' 'bad' '121212' >/dev/null
./plow.py 'test.com' >/dev/null
if [ $? -eq 1 ]; then
    echo "PASS"
else
    echo "FAIL"
fi

echo -n "Testing registering domain succeeds..."
./register.py 'test.com' 'test' '1.1.1.1' '{}' '121212' >/dev/null
sleep 1
./plow.py 'test.com' >/dev/null
if [ $? -eq 0 ]; then
    echo "PASS"
else
    echo "FAIL"
fi

echo -n "Testing modifying domain succeeds..."
./modify.py 'test.com' 'test' '2.2.2.2' '{}' '121212' >/dev/null
./plow.py 'test.com' >/dev/null
if [ $? -eq 0 ]; then
    echo "PASS"
else
    echo "FAIL"
fi

echo -n "Testing removing domain succeeds..."
./remove.py 'test.com' >/dev/null
sleep 1
./plow.py 'test.com' >/dev/null
if [ $? -eq 1 ]; then
    echo "PASS"
else
    echo "FAIL"
fi
