import crypto from "crypto";
import ethUtils from "ethereumjs-util";
import ethWallet from "ethereumjs-wallet";
import bip39 from "bip39";
const path = "m/44'/60'/0'/0/0";
var ERRORS = {
  invalidHex: "Invalid hex input",
};
var getRandomWallet = function () {
  var randbytes = crypto.randomBytes(32);
  var address = "0x" + ethUtils.privateToAddress(randbytes).toString("hex");
  return { address: address, privKey: randbytes.toString("hex") };
};
var getRandomWalletWithMnemonic = function () {
  const mnemonic = bip39.generateMnemonic();
  const key = ethWallet.hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic));
  const wallet = ethWallet.default.fromExtendedPrivateKey(key.derivePath(path).privateExtendedKey());
  return { address: wallet.getAddressString(), privKey: wallet.getPrivateKeyString(), mnemonic: mnemonic };
};
var isValidHex = function (hex) {
  if (!hex.length) return true;
  hex = hex.toUpperCase();
  var re = /^[0-9A-F]+$/g;
  return re.test(hex);
};
var isValidVanityWallet = function (wallet, input, isChecksum, isContract) {
  var _add = wallet.address;
  if (isContract) {
    var _contractAdd = getDeterministicContractAddress(_add);
    _contractAdd = isChecksum
      ? ethUtils.toChecksumAddress(_contractAdd)
      : _contractAdd;
    wallet.contract = _contractAdd;
    return _contractAdd.substr(2, input.length) == input;
  }
  _add = isChecksum ? ethUtils.toChecksumAddress(_add) : _add;
  return _add.substr(2, input.length) == input;
};
var getVanityWallet = function (
  input = "",
  isChecksum = false,
  isContract = false,
  isMnemonic = false,
  counter = function () {}
) {
  if (!isValidHex(input)) throw new Error(ERRORS.invalidHex);
  input = isChecksum ? input : input.toLowerCase();
  const randomWalletFunc = isMnemonic ? getRandomWalletWithMnemonic : getRandomWallet;
  var _wallet = randomWalletFunc();
  while (!isValidVanityWallet(_wallet, input, isChecksum, isContract)) {
    counter();
    _wallet = randomWalletFunc(isChecksum);
  }
  if (isChecksum) _wallet.address = ethUtils.toChecksumAddress(_wallet.address);
  return _wallet;
};
var getDeterministicContractAddress = function (address) {
  return (
    "0x" +
    ethUtils
      .keccak256(ethUtils.rlp.encode([address, 0]))
      .slice(12)
      .toString("hex")
  );
};
export default { getVanityWallet, isValidHex, ERRORS };
