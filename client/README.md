# Client Scripts

Make sure you install the requirements in `requirements.txt`!

### Metadata
**queries.py**: list all available queries that can be sent to the running node  
**extrinsics.py**: dump all node metadata to list e.g. extrinsic endpoints  

### Admin Tools
**sip.sh**: given an existing real domain add it to the blockchain as well (via register.py)    
**slurp.sh**: sip all of the domains in domains.txt  
**test.sh**: compare the outputs of sip and plow to ensure domains were added correctly  

### Client Tools
**account.py**: list account info like balance  
**transfer.py**: transfer units from one account to another  
**plow.py**: fetch a SIIP certificate for a given domain  
**register.py**: register a domain by uploading a SIIP certificate  
**modify.py**: modify a domain's SIIP certificate  
**remove.py**: remove a domain's SIIP certificate  
