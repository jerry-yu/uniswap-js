const { getPoolInfo } = require("./pool.js");
const { createTrade } = require("./trading.js");
const { ethers } = require('ethers');
const { CurrentConfig } = require('./config.js');
const { ERC20_ABI, SWAP_ROUTER_ADDRESS, TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER } = require('./constants');
const { mainprovider } = require('./providers');
const { fromReadableAmount ,exec} = require('./utils');

const { Currency, CurrencyAmount, Percent, Token, TradeType } = require('@uniswap/sdk-core');
const { Pool, Route, SwapOptions, SwapQuoter, SwapRouter, Trade } = require('@uniswap/v3-sdk');

const { v4Main } = require('./v4');
const {getFullTickData,searchPools,getTokenPools,testQuery} = require('./tick');


async function v3Trade() {
    const trade = await createTrade(1);
    console.log(trade.inputAmount, trade.outputAmount);
    for (const swap of trade.swaps) {
        console.log(swap.route.pools);
    }

    const tokenContract = new ethers.Contract(
        CurrentConfig.tokens.in.address,
        ERC20_ABI,
        mainprovider
    );

    const tx = await tokenContract.populateTransaction.approve(
        SWAP_ROUTER_ADDRESS,
        fromReadableAmount(
            TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
            CurrentConfig.tokens.in.decimals,
        ).toString()
    );
    console.log(tx);

    const payload = {
        method: 'sign_tx',
        param: {
            id: "a664ee06-6dfd-4a4b-a204-de16dca8a194",
            chain_type: 'ETHEREUM',
            address: CurrentConfig.wallet.address,
            input: {
                nonce: '0',
                to: CurrentConfig.tokens.in.address,
                value: '0',
                gas_price: '1111222222211',
                gas: '21000',
                data: tx.data.slice(2),
                network: 'MAINNET',
            },
            key: {
                Password: "",
            },
        },
    };
    const jsonPayload = JSON.stringify(payload);

    const [error, stdout] = await exec(
        `/root/hd-wallet/target/release/hd-wallet sign_tx '${jsonPayload}'`
    );
    console.log('error:', error);
    console.log('stdout:', stdout);
    // send transaction
    // ======================== apporve token ok
    // ========================
    const options = {
        slippageTolerance: new Percent(50, 10_000),
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        recipient: CurrentConfig.wallet.address,
    };

    const methodParameters = SwapRouter.swapCallParameters([trade], options);
    console.log(methodParameters);
    const payload2 = {
        method: 'sign_tx',
        param: {
            id: "a664ee06-6dfd-4a4b-a204-de16dca8a194",
            chain_type: 'ETHEREUM',
            address: CurrentConfig.wallet.address,
            input: {
                nonce: '1',
                to: SWAP_ROUTER_ADDRESS,
                value: '0',
                gas_price: '1111222222211',
                gas: '2100000',
                data: methodParameters.calldata.slice(2),
                network: 'MAINNET',
            },
            key: {
                Password: "",
            },
        },
    };
    const jsonPayload2 = JSON.stringify(payload2);

    const [error2, stdout2] = await exec(
        `/root/hd-wallet/target/release/hd-wallet sign_tx '${jsonPayload2}'`
    );
    console.log('error:', error2);
    console.log('stdout:', stdout2);
}

async function main() {

    
    //await getFullTickData('0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8').then(ticks => console.log(ticks));
    //await v3Trade();
    //await v4Main();
    //const tokens = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'];
    //searchPools(tokens, null);
    //await testQuery();
    await getTokenPools(['0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599','0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48','0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2']); 
}

main();