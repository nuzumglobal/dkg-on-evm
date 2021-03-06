/**
 * @typedef {object} Diff
 * @property {number[]} balancesAfter balances diff
 * @property {number} gasUsed gas used in the execution
 */

const dkg = artifacts.require('./dkg.sol');
const util = require('util');
const dkgUtils = require('./utils.js');
const constants = require('../testsData/constants.js');

/**
 * Asserts the instance's phase is phaseNum.
 * @param {number} phaseNum 
 * @param {*} instance 
 */
async function verifyPhase(phaseNum, instance) {
  let curPhase = await instance.curPhase.call();
  assert.equal(phaseNum, curPhase.toNumber(), 
    util.format("should be in phase number %s but in phase %s", phaseNum, curPhase.toNumber()));
}

/**
 * Returns the diff of the ether balance in the inputted accounts between
 * after and before the execution of the function func.
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {*} func async function to execute
 * @returns {Diff}
 */
async function getAccountsBalancesDiffAfterFunc(instance, accounts, func) {
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();

  let balancesBefore = [];
  for (var i = 0; i < numOfParticipants; i++) {
    let balance = await web3.eth.getBalance(accounts[i]);
    balancesBefore.push(balance.toNumber());
  }

  let gasUsed = await func();

  let balancesAfter = [];
  for (var i = 0; i < numOfParticipants; i++) {
    let balance = await web3.eth.getBalance(accounts[i]);
    balancesAfter.push(balance.toNumber() - balancesBefore[i]);
  }
  return {
    balancesAfter,
    gasUsed
  };
}


/**
 * Assets contract balance is expectedBalance
 * @param {number} expectedBalance 
 */
async function verifyContractBalance(expectedBalance) {
  let contractBalance = await web3.eth.getBalance(dkg.address);
  assert.equal(
    expectedBalance, contractBalance.toNumber(), 
    util.format(
      "contract balance is %s while expected balance is %s", 
      contractBalance.toNumber(), expectedBalance
  ));
}


/**
 * Mines empty numOfBlockToMine blocks
 * @param {number} numOfBlockToMine 
 */
async function mineEmptyBlocks(numOfBlockToMine) {
  let latestBlock = await web3.eth.getBlock("latest");
  let startBlockNum = latestBlock.number;
  await dkgUtils.forceMineBlocks(numOfBlockToMine);
  latestBlock = await web3.eth.getBlock("latest");
  assert.equal(latestBlock.number-numOfBlockToMine, startBlockNum, "Not enough empty blocks were mined");
}

/**
 * Assets an error has accour during the execution of the promise.
 * @param {*} promise 
 * @param {string} errorType 
 */
async function assertError(promise, errorType) {
  try {
    await promise;
    throw null;
  }
  catch (error) {
    assert(error, "Expected an error but did not get one");
    assert(error.message.startsWith(constants.EXCEPTION_PREFIX + errorType), 
      util.format("Expected an error starting with %s but got %s instead", 
      constants.EXCEPTION_PREFIX + errorType, error.message));
  }
}



module.exports = {
  verifyPhase,
  verifyContractBalance,
  getAccountsBalancesDiffAfterFunc,
  mineEmptyBlocks,
  assertError
}