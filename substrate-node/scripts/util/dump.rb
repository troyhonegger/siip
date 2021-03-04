#!/usr/bin/env ruby

# Dumps all of the SIIP certificates on the blockchain via RPC calls.

require 'json'

# Method is a string
# Args is an array (usually of one string)
def rpc(method, args)
  curl = %x{
    curl -s http://localhost:9933 -H "Content-Type:application/json;charset=utf-8" -d   '{
      "jsonrpc":"2.0",
      "id":1,
      "method":"#{method}",
      "params": #{args.to_json}
    }'
  }
  JSON.parse(curl)['result']
end

# "14" => 5
def hex_value(str)
  Integer(str, 16) / 4
end

# Given a hex data string, parse the first field from the start.
# (helper method, see below)
# Returns [field (in ASCII), remaining data string (in hex still)]
def parse_field(str)
  # first two chars = first byte, parse it's hex value
  # double it to get number of chars to read, since 2 chars = 1 byte
  len = 2 * hex_value(str[0..1])
  # remove first 2 chars from data
  str = str[2..-1]

  # use len - 1 since str indexes are 0 indexed
  field = str[0..(len - 1)]
  # remove chars from data
  str = str[len..-1]
  # parse field as ASCII
  field = [field].pack('H*')

  return [field, str]
end

# List all of the keys in the blockchain's key value store
keys = rpc('state_getKeys', ['0x5d8734638324806f22725acc04e21bca'])

# Get each SIIP certificate associated with each key
entries = keys.map do |key|
  rpc('state_getStorage', [key])
end

# Parse each SIIP certificate
# They're returned in hex format.. the first 36 bytes are unknown data, but after that it
# follows the format: 1 byte length = n, n bytes data field
# Fields are in the order: name, info, public key, IP, domain name
# Remember, because it's in hex string format, 2 chars = 1 byte.
certs = entries.map do |entry|
  data = entry[74..-1]

  name, data = parse_field(data)
  info, data = parse_field(data)
  pubkey, data = parse_field(data)
  ipaddr, data = parse_field(data)
  domain, data = parse_field(data)

  { name: name, info: info, pubkey: pubkey, ipaddr: ipaddr, domain: domain }
end

puts certs.to_json
