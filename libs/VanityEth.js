const crypto = require('crypto');
var ethUtils = require('ethereumjs-util');
var ERRORS = {
    invalidHex: "Invalid hex input",
    invalidAddress: "Invalid address input",
    invalidBytecode: "Invalid byecode input"
}
var getRandomWallet = function() {
    var randbytes = crypto.randomBytes(32);
    var address = '0x' + ethUtils.privateToAddress(randbytes).toString('hex');
    return { address: address, privKey: randbytes.toString('hex') }
}
function getRandomSalt() {
    var randbytes = crypto.randomBytes(32);
    return randbytes.toString('hex');
}
var isValidHex = function(hex) {
    if (!hex.length) return true;
    var re = /^(0x)?[0-9A-Fa-f]+$/g;
    return re.test(hex);
}
var isValidBytecode = function(bytecode) {
    // console.log(`Yoooo, it's me: ${bytecode}`);
    // console.log(`and my char length is: ${bytecode.length}`);
    if (bytecode.length == 0 || bytecode.length % 2 != 0) return false;
    var re = /^(0x)?[0-9A-Fa-f]+$/g;
    return re.test(bytecode);
}
var cleanHexPrefix = function(hex) {
    return hex.replace(/^0x/, "");
}
var isValidVanityWallet = function(wallet, input, isChecksum, isContract) {
    var _add = wallet.address;
    if (isContract) {
        var _contractAdd = getDeterministicContractAddress(_add);
        _contractAdd = isChecksum ? ethUtils.toChecksumAddress(_contractAdd) : _contractAdd;
        wallet.contract = _contractAdd;
        return _contractAdd.substr(2, input.length) == input
    }
    _add = isChecksum ? ethUtils.toChecksumAddress(_add) : _add;
    return _add.substr(2, input.length) == input;
}
var getVanityWallet = function(input = '', isChecksum = false, isContract = false, ounter = function(){}) {
    if (!isValidHex(input)) throw new Error(ERRORS.invalidHex);
    input = isChecksum ? input : input.toLowerCase();
    var _wallet = getRandomWallet();
    while (!isValidVanityWallet(_wallet, input, isChecksum, isContract)) {
        counter()
        _wallet = getRandomWallet();
    }
    if (isChecksum) _wallet.address = ethUtils.toChecksumAddress(_wallet.address);
    return _wallet;
}
function isValidCreate2Address(wallet, input, creatorAddress, bytecode, isChecksum) {
    var _address = getCreate2ContractAddress(creatorAddress, wallet.saltHex, bytecode);
    _address = isChecksum ? ethUtils.toChecksumAddress(_address) : _address;
    wallet.address = _address;
    return _address.substr(2, input.length) == input
}
var getVanityCreate2Address = function(input = '', isChecksum = false, create2Address = '', create2Bytecode = '', counter = function(){}) {
    if (!isValidHex(input)) throw new Error(ERRORS.invalidHex);
    if (!ethUtils.isValidAddress(create2Address)) throw new Error(ERRORS.invalidAddress);
    if (!isValidBytecode(create2Bytecode)) throw new Error(ERRORS.invalidBytecode);
    input = isChecksum ? input : input.toLowerCase();
    var _wallet = {};
    _wallet.saltHex = getRandomSalt();
    while (!isValidCreate2Address(_wallet, input, create2Address, create2Bytecode, isChecksum)) {
        counter()
        _wallet.saltHex = getRandomSalt();
    }
    if (isChecksum) _wallet.address = ethUtils.toChecksumAddress(_wallet.address);
    return _wallet;
}
var getDeterministicContractAddress = function(address) {
    return '0x' + ethUtils.sha3(ethUtils.rlp.encode([address, 0])).slice(12).toString('hex');
}
function getCreate2ContractAddress (creatorAddress, saltHex, bytecode) {
    var joinedParams = ['ff', creatorAddress, saltHex, ethUtils.sha3(bytecode).toString('hex')].map(x => x.replace(/0x/, '')).join('');
    return `0x${ethUtils.sha3(`0x${joinedParams}`).toString('hex').slice(-40)}`.toLowerCase()
}
module.exports = {
    getVanityWallet: getVanityWallet,
    getVanityCreate2Address: getVanityCreate2Address,
    isValidHex: isValidHex,
    isValidBytecode: isValidBytecode,
    cleanHexPrefix: cleanHexPrefix,
    ERRORS: ERRORS
}
