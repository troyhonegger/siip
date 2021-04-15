# Assumes the application has already been built successfully via "cargo build"

FROM paritytech/ci-linux:f592485d-20210318
WORKDIR /app
EXPOSE 9933
EXPOSE 9944
EXPOSE 30333
COPY target/debug/siip-node .
ENTRYPOINT ["./siip-node", "--unsafe-ws-external", "--unsafe-rpc-external", "--base-path", "/var/siip" ]

# justification of --unsafe-ws-external and --unsafe-rpc-external: These flags tell Substrate to bind
# the websocket and RPC servers to 0.0.0.0 (i.e. any interface) as opposed to just the localhost interface 127.0.0.1.
# This is marked as unsafe, because these servers should not be exposed to the web, as outside actors could use them to
# do nefarious things. However, we use Docker to map these ports on the container to the localhost interface on the host.
# So the servers are still inaccessible to the web
# see https://github.com/paritytech/substrate/wiki/Public-RPC for more info
