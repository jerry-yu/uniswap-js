const { Token } = require('@uniswap/sdk-core');
const { FeeAmount } = require('@uniswap/v3-sdk');

const { USDC_TOKEN, WETH_TOKEN } = require('./constants.js');

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
  },
  wallet: {
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    privateKey:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  tokens: {
    in: WETH_TOKEN,
    amountIn: 1,
    out: USDC_TOKEN,
    poolFee: FeeAmount.MEDIUM,
  },
};

module.exports = {
  Environment,
  CurrentConfig,
};
