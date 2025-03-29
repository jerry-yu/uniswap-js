const { Token } = require('@uniswap/sdk-core');
const { FeeAmount } = require('@uniswap/v3-sdk');

const { USDC_TOKEN, WETH_TOKEN,WBTC_TOKEN } = require('./constants.js');

// Sets if the example should run locally or on chain
const Environment = {
  LOCAL: 'LOCAL',
  MAINNET: 'MAINNET',
  WALLET_EXTENSION: 'WALLET_EXTENSION',
};

// Example Configuration
const CurrentConfig = {
  env: Environment.MAINNET,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: 'https://eth.llamarpc.com',
    //mainnet: 'https://1rpc.io/sepolia',
  },
  wallet: {
    address: '0x90dF5A3EDE13Ee1D090573460e13B0BFD8aa9708',
    privateKey:
      '0x7cd6c933593b0e45586cf0af345fb7465be456eec7ee7da811975557668fd33c',
  },
  tokens: {
    in: WETH_TOKEN,
    amountIn: 1,
    out: WBTC_TOKEN,
    poolFee: FeeAmount.MEDIUM,
  },
};

module.exports = {
  Environment,
  CurrentConfig,
};
