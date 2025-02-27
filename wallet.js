// This file contains code to easily connect to and get information from a wallet on chain

const { Currency } = require('@uniswap/sdk-core');
const { BigNumber, ethers, providers } = require('ethers');
const JSBI = require('jsbi');

const {
  ERC20_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  WETH_ABI,
  WETH_CONTRACT_ADDRESS,
} = require('./constants');
const { getProvider, getWalletAddress, sendTransaction } = require('./providers');
const { toReadableAmount } = require('./utils');

async function getCurrencyBalance(provider, address, currency) {
  // Handle ETH directly
  if (currency.isNative) {
    return ethers.utils.formatEther(await provider.getBalance(address));
  }

  // Get currency otherwise
  const ERC20Contract = new ethers.Contract(currency.address, ERC20_ABI, provider);
  const balance = await ERC20Contract.balanceOf(address);
  const decimals = await ERC20Contract.decimals();

  // Format with proper units (approximate)
  return toReadableAmount(balance, decimals);
}

// Wraps ETH (rounding up to the nearest ETH for decimal places)
async function wrapETH(eth) {
  const provider = getProvider();
  const address = getWalletAddress();
  if (!provider || !address) {
    throw new Error('Cannot wrap ETH without a provider and wallet address');
  }

  const wethContract = new ethers.Contract(WETH_CONTRACT_ADDRESS, WETH_ABI, provider);

  const transaction = {
    data: wethContract.interface.encodeFunctionData('deposit'),
    value: BigNumber.from(Math.ceil(eth))
      .mul(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)).toString())
      .toString(),
    from: address,
    to: WETH_CONTRACT_ADDRESS,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  await sendTransaction(transaction);
}

// Unwraps ETH (rounding up to the nearest ETH for decimal places)
async function unwrapETH(eth) {
  const provider = getProvider();
  const address = getWalletAddress();
  if (!provider || !address) {
    throw new Error('Cannot unwrap ETH without a provider and wallet address');
  }

  const wethContract = new ethers.Contract(WETH_CONTRACT_ADDRESS, WETH_ABI, provider);

  const transaction = {
    data: wethContract.interface.encodeFunctionData('withdraw', [
      BigNumber.from(Math.ceil(eth))
        .mul(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)).toString())
        .toString(),
    ]),
    from: address,
    to: WETH_CONTRACT_ADDRESS,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  await sendTransaction(transaction);
}

module.exports = {
  getCurrencyBalance,
  wrapETH,
  unwrapETH,
};
