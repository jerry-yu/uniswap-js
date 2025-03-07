const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { computePoolAddress } = require('@uniswap/v3-sdk');
const { ethers } = require('ethers');

const { CurrentConfig } = require('./config.js');
const { POOL_FACTORY_CONTRACT_ADDRESS_SEPOLIA,POOL_FACTORY_CONTRACT_ADDRESS } = require('./constants.js');
const { getProvider } = require('./providers.js');

async function getPoolInfo(provider,inToken,outToken,chainId = 1) {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: chainId == 1? POOL_FACTORY_CONTRACT_ADDRESS: POOL_FACTORY_CONTRACT_ADDRESS_SEPOLIA,
    tokenA: inToken,
    tokenB: outToken,
    fee: CurrentConfig.tokens.poolFee,
    chainId: chainId,
  });
  console.log(chainId,inToken,outToken, CurrentConfig.tokens.poolFee);
console.log('currentPoolAddress:', currentPoolAddress);
  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  );

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

module.exports = {
  getPoolInfo,
};
