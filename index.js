#! /usr/bin/env node

import VanityEth from "./libs/VanityEth.js";
import ora from "ora";
import cluster from "cluster";
import TimeFormat from "hh-mm-ss";
import { cpus } from "os";
import Yargs from "yargs";
import process from "process";
import fs from "fs";

const numCPUs = cpus().length > 1 ? cpus().length - 1 : 1;
const argv = Yargs(process.argv.slice(2))
  .usage("Usage: $0 <command> [options]")
  .example(
    "$0 -checksum -i B00B5",
    "get a wallet where address matches B00B5 in checksum format"
  )
  .example(
    "$0 --contract -i ABC",
    "get a wallet where 0 nonce contract address matches the vanity"
  )
  .example("$0 -n 25 -i ABC", "get 25 vanity wallets")
  .example("$0 -n 1000", "get 1000 random wallets")
  .alias("i", "input")
  .string("i")
  .describe("i", "input hex string")
  .alias("c", "checksum")
  .boolean("c")
  .describe("c", "check against the checksum address")
  .alias("n", "count")
  .number("n")
  .describe("n", "number of wallets")
  .boolean("contract")
  .describe("contract", "contract address for contract deployment")
  .alias("l", "log")
  .boolean("l")
  .describe("l", "log output to file")
  .help("h")
  .alias("h", "help")
  .epilog("copyright 2021").argv;

if (cluster.isMaster) {
  const args = {
    input: argv.input ? argv.input : "",
    isChecksum: argv.checksum ? true : false,
    numWallets: argv.count ? argv.count : 1,
    isContract: argv.contract ? true : false,
    log: argv.log ? true : false,
    logFname: argv.log ? "VanityEth-log-" + Date.now() + ".txt" : "",
  };
  if (!VanityEth.isValidHex(args.input)) {
    console.error(args.input + " is not valid hexadecimal");
    process.exit(1);
  }
  let logStream;
  if (args.log) {
    console.log("logging into " + args.logFname);
    logStream = fs.createWriteStream(args.logFname, { flags: "a" });
  }
  let walletsFound = 0;
  const spinner = ora("generating vanity address 1/" + args.numWallets).start();
  let addps = 0;
  setInterval(function () {
    spinner.text =
      "Approximate ETA for an account " +
      TimeFormat.fromS(
        Math.pow(16, 20) / Math.pow(16, 20 - args.input.length) / addps,
        "hh:mm:ss"
      );
    addps = 0;
  }, 1000);
  for (let i = 0; i < numCPUs; i++) {
    const worker_env = {
      input: args.input,
      isChecksum: args.isChecksum,
      isContract: args.isContract,
    };
    const proc = cluster.fork(worker_env);
    proc.on("message", function (message) {
      if (message.account) {
        spinner.succeed(JSON.stringify(message));
        if (args.log) logStream.write(JSON.stringify(message) + "\n");
        walletsFound++;
        if (walletsFound >= args.numWallets) {
          cleanup();
        }
        spinner.text =
          "generating vanity address " +
          (walletsFound + 1) +
          "/" +
          args.numWallets;
        spinner.start();
      } else if (message.counter) {
        addps++;
      }
    });
  }
} else {
  const worker_env = process.env;
  while (true) {
    if (process.send) {
      process.send({
        account: VanityEth.getVanityWallet(
          worker_env.input,
          worker_env.isChecksum == "true",
          worker_env.isContract == "true",
          function () {
            process.send({
              counter: true,
            });
          }
        ),
      });
    }
  }
}
process.stdin.resume();
const cleanup = function (options, err) {
  if (err) console.log(err.stack);
  for (const id in cluster.workers) cluster.workers[id].process.kill();
  process.exit();
};
process.on("exit", cleanup.bind(null, {}));
process.on("SIGINT", cleanup.bind(null, {}));
process.on("uncaughtException", cleanup.bind(null, {}));
