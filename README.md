# Vanity Eth

Nodejs based tool to generate vanity ethereum addresses

# Features!

  - Generate multiple addresses
  - Supports Multi-core processors
  - vanity contract address
  - log to file
  - checksum based vanity address

### Installation
```sh
$ npm install -g vanity-eth
$ vanityeth -i deadbeef
```
### Examples

Generate ethereum address:
```sh
$ vanityeth
```

generate 10 ethereum addresses:
```sh
$ vanityeth -n 10
```

generate 10 ethereum addresses with deadbeef as starting characters:
```sh
$ vanityeth -n 10 -i deadbeef
```
generate 10 ethereum addresses with DEADBEEF as the checksum address (case sensitive):
```sh
$ vanityeth -n 10 -i DEADBEEF -c
```
generate ethereum address with vanity contract address:
```sh
$ vanityeth -i deadbeef --contract
```
log to file
```sh
$ vanityeth -n 10 -l
```
help me
```sh
$ vanityeth -h
```
### Docker usage

Get the image
```sh
# Build image locally after cloning repository
$ docker build -t vanityeth .

# or download image
docker pull myetherwallet/vanityeth
```

Usage
```
$ docker run -it vanityeth

# Pass additional arguments
$ docker run -it myetherwallet/vanityeth -i deadbeef
```

### Running Locally
To run from source:
```sh
git clone git@github.com:MyEtherWallet/VanityEth.git
cd VanityEth
npm install
./index.js
```

License
----

MIT

