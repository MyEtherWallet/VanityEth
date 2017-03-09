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
$ vanityeth -i b00b5
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

generate 10 ethereum addresses with b00b5 as starting characters:
```sh
$ vanityeth -n 10 -i b00b5
```
generate 10 ethereum addresses with B00B5 as the checksum address (case sensitive):
```sh
$ vanityeth -n 10 -i B00B5 -c
```
generate ethereum address with vanity contract address:
```sh
$ vanityeth -i b00b5 --contract
```
log to file
```sh
$ vanityeth -n 10 -l
```
help me
```sh
$ vanityeth -h
```

License
----

MIT

