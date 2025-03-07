const { BaseProvider } = require('@ethersproject/providers');
const { BigNumber, ethers, providers } = require('ethers');

const { CurrentConfig, Environment } = require('./config.js');

// 单例 provider 和钱包
const mainnetProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.mainnet);
const wallet = createWallet();

const browserExtensionProvider = createBrowserExtensionProvider();
let walletExtensionAddress = null;


const TransactionState = {
  Failed: 'Failed',
  New: 'New',
  Rejected: 'Rejected',
  Sending: 'Sending',
  Sent: 'Sent',
};


function getMainnetProvider() {
  return mainnetProvider;
}

function getProvider() {
  return CurrentConfig.env === Environment.WALLET_EXTENSION ? browserExtensionProvider : wallet.provider;
}

function getWalletAddress() {
  return CurrentConfig.env === Environment.WALLET_EXTENSION ? walletExtensionAddress : wallet.address;
}

async function sendTransaction(transaction) {
  if (CurrentConfig.env === Environment.WALLET_EXTENSION) {
    return sendTransactionViaExtension(transaction);
  } else {
    if (transaction.value) {
      transaction.value = BigNumber.from(transaction.value);
    }
    return sendTransactionViaWallet(transaction);
  }
}

async function connectBrowserExtensionWallet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  const { ethereum } = window;
  const provider = new ethers.providers.Web3Provider(ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);

  if (accounts.length !== 1) {
    return;
  }

  walletExtensionAddress = accounts[0];
  return walletExtensionAddress;
}

function createWallet() {
  let provider = mainnetProvider;
  if (CurrentConfig.env === Environment.LOCAL) {
    provider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local);
  }
  return new ethers.Wallet(CurrentConfig.wallet.privateKey, provider);
}

function createBrowserExtensionProvider() {
  try {
    return new ethers.providers.Web3Provider(window?.ethereum, 'any');
  } catch (e) {
    console.log('No Wallet Extension Found');
    return null;
  }
}

async function sendTransactionViaExtension(transaction) {
  try {
    const receipt = await browserExtensionProvider?.send('eth_sendTransaction', [transaction]);
    return receipt ? TransactionState.Sent : TransactionState.Failed;
  } catch (e) {
    console.log(e);
    return TransactionState.Rejected;
  }
}

async function sendTransactionViaWallet(transaction) {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value);
  }
  const txRes = await wallet.sendTransaction(transaction);

  let receipt = null;
  const provider = getProvider();
  if (!provider) {
    return TransactionState.Failed;
  }

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash);
      if (receipt === null) {
        continue;
      }
    } catch (e) {
      console.log(`Receipt error:`, e);
      break;
    }
  }

  return receipt ? TransactionState.Sent : TransactionState.Failed;
}

module.exports = {
  getMainnetProvider,
  getProvider,
  getWalletAddress,
  sendTransaction,
  connectBrowserExtensionWallet,
  TransactionState,
};
