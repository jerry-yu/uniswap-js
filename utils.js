const { Token, TradeType } = require('@uniswap/sdk-core');
const { Trade } = require('@uniswap/v3-sdk');
const { BigNumber, ethers } = require('ethers');
const childProcess = require('child_process');

async function exec(command, options) {
    const arr = await new Promise(resolve => {
        childProcess.exec(command, options || {}, (error, stdout, stderr) => {
            resolve([error, stdout, stderr]);
        });
    });

    return arr;
};

const MAX_DECIMALS = 4;

function fromReadableAmount(amount, decimals) {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

function toReadableAmount(rawAmount, decimals) {
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, MAX_DECIMALS);
}

function displayTrade(trade) {
  return `${trade.inputAmount.toExact()} ${trade.inputAmount.currency.symbol} for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`;
}


module.exports = {
  fromReadableAmount,
  toReadableAmount,
  displayTrade,
  exec
};
