#!/usr/bin/env bash

# Fetch a domain's IP and TLS certificate, and add to the blockchain

# USAGE: sip DOMAIN
# e.g. sip www.google.com

domain=$1
ip=$(dig $domain +short | head -n1)
pubkey=$(echo | openssl s_client -connect $domain:443 2>/dev/null | openssl x509 -pubkey -noout | head -n -1 | tail -n +2 | tr -d '\n')

echo "$domain $ip $pubkey"
#./add.sh $domain $ip $pubkey
