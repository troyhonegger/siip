#!/usr/bin/env bash

# After running slurp, compares results of dig and plow for several popular domains to ensure
# they were added to the blockchain correctly.

plow=($(./plow.sh $1))
sip=($(./sip.sh $1))

echo "Comparing IPs:"
diff <(echo "${plow[1]}") <(echo "${sip[1]}")
echo "Comparing Keys:"
diff <(echo "${plow[2]}") <(echo "${sip[2]}")
