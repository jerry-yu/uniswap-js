const { Currency, CurrencyAmount, Percent, Token, TradeType } = require('@uniswap/sdk-core');
const { Pool, Route, SwapOptions, SwapQuoter, SwapRouter, Trade } = require('@uniswap/v3-sdk');
const { ethers } = require('ethers');
const JSBI = require('jsbi');

const { CurrentConfig } = require('./config.js');
const {
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  USDC_TOKEN,
} = require('./constants');
const { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } = require('./constants');
const { getPoolInfo } = require('./pool');
const {
  getMainnetProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} = require('./providers');
const { fromReadableAmount } = require('./utils');
const { Trade : RouterTrade }= require('@uniswap/router-sdk') ;

async function createTrade(chainId) {
  const provider = getMainnetProvider();
  if (!provider) {
    throw new Error('No provider');
  }
  const poolInfo1 = await getPoolInfo(provider,CurrentConfig.tokens.in,USDC_TOKEN,chainId);
  const poolInfo2 = await getPoolInfo(provider,USDC_TOKEN,CurrentConfig.tokens.out,chainId);

  console.log('poolInfo1:', poolInfo1);
  console.log('poolInfo2:', poolInfo2);
  const pool1 = new Pool(
    CurrentConfig.tokens.in,
    USDC_TOKEN,
    CurrentConfig.tokens.poolFee,
    poolInfo1.sqrtPriceX96.toString(),
    poolInfo1.liquidity.toString(),
    poolInfo1.tick
  );

  const pool2 = new Pool(
    USDC_TOKEN,
    CurrentConfig.tokens.out,
    CurrentConfig.tokens.poolFee,
    poolInfo2.sqrtPriceX96.toString(),
    poolInfo2.liquidity.toString(),
    poolInfo2.tick
  );

  console.log('pool1:', pool1);
  console.log('pool2:', pool2);

  const swapRoute = new Route(
    [pool1, pool2],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  );

  // const rt =await RouterTrade.fromRoute(swapRoute, CurrencyAmount.fromRawAmount(
  //   CurrentConfig.tokens.in,
  //   fromReadableAmount(
  //     CurrentConfig.tokens.amountIn,
  //     CurrentConfig.tokens.in.decimals
  //   ).toString()
  // ), TradeType.EXACT_INPUT);



  const amountOut = await getOutputQuote(provider,QUOTER_CONTRACT_ADDRESS,CurrentConfig.tokens.in,CurrentConfig.tokens.amountIn, swapRoute);
  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.out,
      JSBI.BigInt(amountOut)
    ),
    tradeType: TradeType.EXACT_INPUT,
  });

  // const uncheckedTrade = Trade.fromRoute(swapRoute, CurrencyAmount.fromRawAmount(
  //   CurrentConfig.tokens.in,
  //   fromReadableAmount(
  //     CurrentConfig.tokens.amountIn,
  //     CurrentConfig.tokens.in.decimals
  //   ).toString()
  // ), TradeType.EXACT_INPUT);

  return uncheckedTrade;
}

async function executeTrade(trade) {
  const walletAddress = getWalletAddress();
  const provider = getProvider();

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet');
  }

  const tokenApproval = await getTokenTransferApproval(CurrentConfig.tokens.in);

  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  const options = {
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    recipient: walletAddress,
  };

  const methodParameters = SwapRouter.swapCallParameters([trade], options);

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  return await sendTransaction(tx);
}

async function getOutputQuote(provider,quoteAddress,inToken,amountIn,route) {
  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      inToken,
      fromReadableAmount(
        amountIn,
        inToken.decimals
      ).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  );
console.log("---------------------",calldata);
  const quoteCallReturnData = await provider.call({
    to: quoteAddress,
    data: calldata,
  });

  return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData);
}

async function getTokenTransferApproval(token) {
  const provider = getProvider();
  const address = getWalletAddress();
  if (!provider || !address) {
    console.log('No Provider Found');
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    );

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      fromReadableAmount(
        TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
        token.decimals
      ).toString()
    );

    return sendTransaction({
      ...transaction,
      from: address,
    });
  } catch (e) {
    console.error(e);
    return TransactionState.Failed;
  }
}

module.exports = {
  createTrade,
  executeTrade,
  getOutputQuote,
  getTokenTransferApproval,
};
