#! /usr/bin/env node

var VanityEth = require('./libs/VanityEth');
const ora = require('ora');
var cluster = require('cluster')
var numCPUs = require('os').cpus().length
var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .example('$0 -checksum -i B00B5', 'get a wallet where address matches B00B5 in checksum format')
    .example('$0 -contract -i ABC', 'get a wallet where 0 nonce contract address matches the vanity')
    .example('$0 -n 25 -i ABC', 'get 25 vanity wallets')
    .example('$0 -n 1000', 'get 1000 random wallets')
    .alias('i', 'input')
    .string('i')
    .describe('i', 'input hex string')
    .alias('c', 'checksum')
    .boolean('c')
    .describe('c', 'check against the checksum address')
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
    .epilog('copyright 2017')
    .argv;
if (cluster.isMaster) {
    const args = {
        input: argv.input ? argv.input : '',
        isChecksum: argv.checksum ? true : false,
        numWallets: argv.count ? argv.count : 1,
        isContract: argv.contract ? true : false,
        log: argv.log ? true : false,
        logFname: argv.log ? 'VanityEth-log-' + Date.now() + '.txt' : ''
    }
    if (!VanityEth.isValidHex(args.input)) {
        console.error(args.input + ' is not valid hexadecimal');
        process.exit(1);
    }
    if (args.log) {
        var fs = require('fs');
        console.log('logging into' + args.logFname);
        var logStream = fs.createWriteStream(args.logFname, { 'flags': 'a' });
    }
    var walletsFound = 0;
    const spinner = ora('generating vanity address 1/' + args.numWallets).start();
    for (var i = 0; i < numCPUs; i++) {
        const worker_env = {
            input: args.input,
            isChecksum: args.isChecksum,
            isContract: args.isContract
        }
        proc = cluster.fork(worker_env);
        proc.on('message', function(message) {
            spinner.succeed(JSON.stringify(message));
            if (args.log) logStream.write(JSON.stringify(message) + "\n");
            walletsFound++;
            if (walletsFound >= args.numWallets) {
                cleanup();
            }
            spinner.text ='generating vanity address ' + (walletsFound + 1)  +'/' + args.numWallets;
            spinner.start();
        });
    }

} else {
    const worker_env = process.env;
    while (true) {
        process.send(VanityEth.getVanityWallet(worker_env.input, worker_env.isChecksum == 'true', worker_env.isContract == 'true'))
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
