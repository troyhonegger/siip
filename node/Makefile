CONTAINER=siip-node
PROFILE=default

default: build image

all: build image deploy

build:
	cargo build

clean:
	cargo clean

image: | build
	docker build -t $(CONTAINER) .

run: | build
	target/debug/siip-node --no-mdns --tmp --alice

deploy: | build image
	docker-compose --profile $(PROFILE) up

.PHONY: all build clean default image run deploy
