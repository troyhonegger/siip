#!/usr/bin/env bash

# Using a list of the top 500 websites, pass each one to sip and then feed.

while read -r domain
do
    ./sip.sh $domain
    sleep 1
done < "domains.txt"
