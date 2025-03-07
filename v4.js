// const {  Currency, CurrencyAmount, TradeType, 
//   Percent, Trade, Pool, V4PositionManager , 
//   } =require('@uniswap/v4-sdk');
const { ethers } =require('ethers');
const { Ether,Token,Trade, TradeType,CurrencyAmount} =require('@uniswap/sdk-core');
const { encodeSqrtRatioX96,ADDRESS_ZERO, } =require('@uniswap/v3-sdk');
 const { SwapRouter : UniSwapRouter,  } = require('@uniswap/universal-router-sdk');

const { createTrade } = require("./trading.js");
const { CurrentConfig } = require('./config.js');
const { ERC20_ABI, SWAP_ROUTER_ADDRESS, TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER, QUOTER_CONTRACT_ADDRESS_SEPOLIA } = require('./constants');
const { fromReadableAmount ,exec} = require('./utils');
const { getPoolInfo } = require('./pool');
const { Pool : v3Pool, Route,  SwapQuoter, SwapRouter, Trade:v3Trade } = require('@uniswap/v3-sdk');
const {getOutputQuote} = require('./trading.js');
const JSBI = require('jsbi');
const { Trade : RouterTrade }= require('@uniswap/router-sdk') ;

const ETH = Ether.onChain(11155111);
const USDC = new Token(11155111, '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 6, 'USDC', 'USDC');
const WETH = new Token(11155111, '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', 18, 'WETH', 'Wraped Ether');

const poolKey = {
  token0: ETH < USDC ? ETH : USDC,
  token1: ETH < USDC ? USDC : ETH,
  fee: 3000, // 0.3% fee
  tickSpacing: 60,
  hooks: ADDRESS_ZERO,
};

const poolManagerAddress = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543'; 

const universalRouterAddress = '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b'; 

// https://ethereum-sepolia-rpc.publicnode.com
const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.public.blastapi.io'); // 替换为您的提供者 URL

async function v4Trade() {
  try {

  const poolInfo = await getPoolInfo(provider,WETH,USDC,11155111);
console.log('poolInfo:', poolInfo); 
  const pool = new v3Pool(
    WETH,
    USDC,
    CurrentConfig.tokens.poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  console.log('pool --->', pool);
  const swapRoute = new Route(
    [pool],
    WETH,
    USDC
  );

  console.log('swapRoute chain id :', swapRoute.chainId);
  const amountOut = await getOutputQuote(provider,QUOTER_CONTRACT_ADDRESS_SEPOLIA,WETH,CurrentConfig.tokens.amountIn,swapRoute);

console.log('amountOut:', amountOut);

const rt = new RouterTrade({
  v3Routes:  [{ routev3: swapRoute, inputAmount:  CurrencyAmount.fromRawAmount(
    WETH,
    fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      WETH.decimals
    ).toString()
  ), outputAmount: CurrencyAmount.fromRawAmount(
    USDC,
    JSBI.BigInt(amountOut)
  )}],
  tradeType: TradeType.EXACT_INPUT,
});

console.log('RouterTrade: ===========  ', rt);

  // const uncheckedTrade = Trade.createUncheckedTrade({
  //   route: swapRoute,
  //   inputAmount: CurrencyAmount.fromRawAmount(
  //     CurrentConfig.tokens.in,
  //     fromReadableAmount(
  //       CurrentConfig.tokens.amountIn,
  //       CurrentConfig.tokens.in.decimals
  //     ).toString()
  //   ),
  //   outputAmount: CurrencyAmount.fromRawAmount(
  //     CurrentConfig.tokens.out,
  //     JSBI.BigInt(amountOut)
  //   ),
  //   tradeType: TradeType.EXACT_INPUT,
  // });
  const num = CurrencyAmount.fromRawAmount(
    WETH,
    '100000000000000000'
  );
console.log('swapRoute begin',num);
  const trade = await RouterTrade.fromRoute(swapRoute,num,TradeType.EXACT_INPUT);
  console.log('trade:', trade);

 //const param =  await UniSwapRouter.swapCallParameters(uncheckedTrade, SwapOptions({}))

  // const tokenContract = new ethers.Contract(
  //     CurrentConfig.tokens.in.address,
  //     ERC20_ABI,
  //     provider
  // );

  // const tx = await tokenContract.populateTransaction.approve(
  //   universalRouterAddress,
  //     fromReadableAmount(
  //         TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  //         WETH.decimals,
  //     ).toString()
  // );
  // console.log(tx);

  // const payload = {
  //         method: 'sign_tx',
  //         param: {
  //             id: "a664ee06-6dfd-4a4b-a204-de16dca8a194",
  //             chain_type: 'ETHEREUM',
  //             address: CurrentConfig.wallet.address,
  //             input: {
  //                 nonce: '0',
  //                 to: CurrentConfig.tokens.in.address,
  //                 value: '0',
  //                 gas_price: '1111222222211',
  //                 gas: '21000',
  //                 data: tx.data.slice(2),
  //                 network: 'MAINNET',
  //             },
  //             key: {
  //                 Password: "",
  //             },
  //         },
  //     };
  //     const jsonPayload = JSON.stringify(payload);
  
  //     const [error, stdout] = await exec(
  //         `/root/hd-wallet/target/release/hd-wallet sign_tx '${jsonPayload}'`
  //     );
  //     console.log('error:', error);
  //     console.log('stdout:', stdout);





} catch (error) {
  console.error('err :', error);
}

}


async function v4Main() {
  try {
    await v4Trade();
    
  } catch (error) {
    console.error('err :', error);
  }
}

module.exports = {
    v4Main,
  };
  