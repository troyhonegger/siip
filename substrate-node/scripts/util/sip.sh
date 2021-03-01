#!/usr/bin/env bash

# Fetch a domain's IP and TLS certificate, and pass to 'feed' to add to the blockchain

# USAGE: sip DOMAIN
# e.g. sip www.google.com

domain=$1
ip=$(dig $domain +short | head)

#echo | openssl s_client -showcerts -servername gnupg.org -connect gnupg.org:443 2>/dev/null | openssl x509 -inform pem -noout -text

echo | openssl s_client -connect $domain:443 | openssl x509 -pubkey -noout
