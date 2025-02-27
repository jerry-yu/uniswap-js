const { getPoolInfo } =require("./pool.js");
const {createTrade} = require("./trading.js");
const { ethers } = require('ethers');
const { CurrentConfig } = require('./config.js');
const { ERC20_ABI, SWAP_ROUTER_ADDRESS, TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER } = require('./constants');
const {mainprovider} = require('./providers');
const {fromReadableAmount} = require('./utils');

async function main() {
    const trade = await createTrade();
    console.log(trade.inputAmount,trade.outputAmount);
    for (const swap of trade.swaps) {
        console.log(swap.route.pools);
    }

    const tokenContract = new ethers.Contract(
        token.address,
        CurrentConfig.tokens.in.address,
        ERC20_ABI,
        mainprovider
      );
  
      const transaction = await tokenContract.populateTransaction.approve(
        SWAP_ROUTER_ADDRESS,
        fromReadableAmount(
          TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
          CurrentConfig.tokens.in.decimals,
        ).toString()
      );

}

main();