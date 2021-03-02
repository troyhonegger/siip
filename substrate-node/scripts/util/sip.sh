#!/usr/bin/env bash

# Fetch a domain's IP and TLS certificate, and pass to 'feed' to add to the blockchain

# USAGE: sip DOMAIN
# e.g. sip www.google.com

domain=$1
ip=$(dig $domain +short | head -n1)
pubkey=$(echo | openssl s_client -connect $domain:443 2>/dev/null | openssl x509 -pubkey -noout | head -n -1 | tail -n +2 | tr -d '\n')

echo "Adding $domain ($ip) (${pubkey:0:16}...)"
./feed.sh $domain $ip $pubkey
