#! /usr/bin/env node

const VanityEth = require('./libs/VanityEth');
const ora = require('ora');
const cluster = require('cluster');
const TimeFormat = require('hh-mm-ss');
const numCPUs = require('os').cpus().length;
const fs = require('fs');
var ethUtils = require('ethereumjs-util');
var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .example('$0 -checksum -i B00B5', 'get a wallet where address matches B00B5 in checksum format')
    .example('$0 --contract -i ABC', 'get a wallet where 0 nonce contract address matches the vanity')
    .example('$0 --create2 0xab5801a7d398351b8be11c439e05c5b3259aec9b -b ./my_bytecode.bin', 'get a vanity address for this bytecode to be deployed by a factory at address 0xab5801(...)')
    .example('$0 -n 25 -i ABC', 'get 25 vanity wallets')
    .example('$0 -n 1000', 'get 1000 random wallets')
    .alias('i', 'input')
    .string('i')
    .describe('i', 'input hex string')
    .alias('c', 'checksum')
    .boolean('c')
    .describe('c', 'check against the checksum address')
    .describe('i', 'input hex string')
    .string('create2')
    .describe('create2', 'contract address for contract deployment with create2 opcode')
    .alias('b', 'bytecode')
    .string('b')
    .describe('b', 'path to file with bytecode to be deployed with CREATE2')
    .alias('n', 'count')
    .number('n')
    .describe('n', 'number of wallets')
    .boolean('contract')
    .describe('contract', 'contract address for contract deployment')
    .alias('l', 'log')
    .boolean('l')
    .describe('l', 'log output to file')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2018')
    .argv;

if (cluster.isMaster) {
    const args = {
        input: argv.input ? argv.input : '',
        isCreate2: argv.create2 ? true : false,
        create2Address: argv.create2,
        create2Bytecode: argv.create2 ? fs.readFileSync(argv.bytecode).toString('utf-8').trim() : '',
        isChecksum: argv.checksum ? true : false,
        numWallets: argv.count ? argv.count : 1,
        isContract: argv.contract ? true : false,
        log: argv.log ? true : false,
        logFname: argv.log ? 'VanityEth-log-' + Date.now() + '.txt' : ''
    }
    if (args.isContract && args.isCreate2) {
        console.error('Cannot use the options "--contract" and "--create2" at the same time');
        process.exit(1);
    }
    if (!VanityEth.isValidHex(args.input)) {
        console.error(args.input + ' is not valid hexadecimal');
        process.exit(1);
    }
    if (args.isCreate2) {
        if (!VanityEth.isValidBytecode(args.create2Bytecode)) {
            console.error(args.create2Bytecode + ' is not valid bytecode');
            process.exit(1);
        }
        if (!ethUtils.isValidAddress(args.create2Address)) {
            console.error(args.create2 + ' is not a valid address');
            process.exit(1);
        }
    }
    if (args.log) {
        console.log('logging into ' + args.logFname);
        var logStream = fs.createWriteStream(args.logFname, { 'flags': 'a' });
    }
    var walletsFound = 0;
    const spinner = ora('generating vanity address 1/' + args.numWallets).start();
    let addps = 0;
    setInterval(function(){
        spinner.text ='Approximate ETA for an account ' + TimeFormat.fromS((Math.pow(16,20)/Math.pow(16,20-args.input.length))/addps, 'hh:mm:ss');
        addps = 0;
    },1000)
    for (var i = 0; i < numCPUs; i++) {
        const worker_env = {
            input: args.input,
            isChecksum: args.isChecksum,
            isContract: args.isContract,
            isCreate2: args.isCreate2,
            create2Address: args.create2Address,
            create2Bytecode: args.create2Bytecode
        }
        proc = cluster.fork(worker_env);
        proc.on('message', function(message) {
            if(message.account){
                spinner.succeed(JSON.stringify(message));
                if (args.log) logStream.write(JSON.stringify(message) + "\n");
                    walletsFound++;
                if (walletsFound >= args.numWallets) {
                    cleanup();
                }
                spinner.text ='generating vanity address ' + (walletsFound + 1)  +'/' + args.numWallets;
                spinner.start();
            } else if(message.counter){
                addps++
            }
        });
    }

} else {
    const worker_env = process.env;
    if(worker_env.isCreate2) {
        while (true) {
            process.send({
                account: VanityEth.getVanityCreate2Address(worker_env.input, worker_env.isChecksum == 'true', worker_env.create2Address, worker_env.create2Bytecode, function (){
                process.send({
                    counter: true
                })
            })})
        }
    } else {
        while (true) {
            process.send({
                account: VanityEth.getVanityWallet(worker_env.input, worker_env.isChecksum == 'true', worker_env.isContract == 'true', function (){
                process.send({
                    counter: true
                })
            })})
        }
    }
}
process.stdin.resume();
var cleanup = function(options, err) {
    if (err) console.log(err.stack);
    for (var id in cluster.workers) cluster.workers[id].process.kill();
    process.exit();
}
process.on('exit', cleanup.bind(null, {}));
process.on('SIGINT', cleanup.bind(null, {}));
process.on('uncaughtException', cleanup.bind(null, {}));
