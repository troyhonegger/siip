# Hardware Considerations for Full Nodes

## Storage

Your full node will need enough storage space for every SIIP certificate online
and for the full history of the blockchain. We anticipate that you should have
approximately a terabyte of storage available for your full node. For best performance,
we recommend solid state memory, although it is not necessarily required.

## Processing

If you want your full node to perform well at mining, we strongly recommend
using a high-performance GPU. Since the task of mining a block is trivially parallelized to
improve performance, adding/upgrading GPU's will boost mining performance in a significantly more cost-effective
way than adding/upgrading CPU's. Any mid-range or better CPU from the past few years should be
sufficient to run a full node.

## Networking

It is extremely important not to overlook the network requirements for your full node.
Your full node will constantly need to communicate with other nodes to discover and
spread unmined transactions and newly mined blocks. Additionally, your full node will
communicate with clients to resolve domain name queries and accept signed transactions from them.
Despite the frequent network communication needed to run a full node, you will not need exceptionally
fast internet speeds, but you will need to watch out for daily/monthly data limits. 
A 50 Megabit/second connection should be plenty fast, but because your node will
communicate so frequently, you will want an internet plan that allows for at least 200Gb of
usage each month without throttling.