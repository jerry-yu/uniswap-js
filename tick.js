const axios = require('axios');

const subgraphUrl = 'https://gateway.thegraph.com/api/?/subgraphs/id/?';
async function getTickDataFromSubgraph(poolAddress, skip) {
  const ticksQuery = JSON.stringify({
    query: `{
      ticks(
        where: {poolAddress: "${poolAddress.toLowerCase()}", liquidityNet_not: "0"}
        first: 10,
        orderBy: tickIdx,
        orderDirection: "asc",
        skip: ${skip}
      ) {
        tickIdx
        liquidityGross
        liquidityNet
      }
    }`
  });

  const response = await axios.post(
    subgraphUrl,
    ticksQuery,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data.ticks;
}

async function getFullTickData(poolAddress) {
  let allTicks = []
  let skip = 0
  let loadingTicks = true
  while (loadingTicks) {
    const ticks = await getTickDataFromSubgraph(poolAddress, skip)
    allTicks = allTicks.concat(ticks)
    if (ticks.length < 1000) {
      loadingTicks = false
    } else {
      skip += 1000
    }
  }

  return allTicks
}

const POOL_SEARCH = `
  query pools($tokens: [Bytes]!, $id: String) {
    as0: pools(where: { token0_in: $tokens }, subgraphError: allow) {
      id
      feeTier
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    as1: pools(where: { token1_in: $tokens }, subgraphError: allow) {
      id
      feeTier
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    asAddress: pools(where: { id: $id }, subgraphError: allow) {
      id
      feeTier
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
  }
`;

async function searchPools(tokens, id) {
  try {
    const query = {
      query: POOL_SEARCH,
      variables: {
        tokens: tokens.map(t => t.toLowerCase()), 
        id: id ? id.toLowerCase() : null
      }
    };
    const response = await axios.post(subgraphUrl, query, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = response.data.data;
    console.log('Pool search results:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error fetching pools:', error);
    throw error;
  }
}


const TOKEN_POOLS = `
  query TokenPools($skip: Int!, $t0: String!, $t1: String!) {
    pools(where: {
      token0_in: [$t0],
      token1_in: [$t1]
    }, first: 10, skip: $skip, orderBy: liquidity, orderDirection: "desc") {
      id
      feeTier
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
      liquidity
      sqrtPrice
      token0Price
      token1Price
      tick
      volumeUSD
      totalValueLockedUSD
    }
  }
`;

function combineTokens(tokens) {
  const result = [];
  const arr = tokens.map(token => token.toLowerCase());

  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      result.push([arr[i], arr[j]]);
    }
  }
  return result;
}

// Function to fetch all pools
async function getTokenPools(tokens) {
  const tokenPairs = combineTokens(tokens);
  let allPools = [];
  let skip = 0;

  for (const [token0, token1] of tokenPairs) {
    while (true) {
      try {
        const response = await axios.post(subgraphUrl, {
          query: TOKEN_POOLS,
          variables: { skip, t0: token0, t1: token1 }
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        const pools = response.data.data.pools;
        allPools = allPools.concat(pools);
        if (pools.length < 1000) break; // Exit if less than batch size
        skip += 1000;
      } catch (error) {
        console.error('Error fetching pools:', error);
        break;
      }
    }
  }

  console.log('Pools:', allPools);
  return allPools;
}


const TestQuery = `
  query {
  __type(name: "Tick_filter") {
    name
    kind
    inputFields {
      name
      type {
        name
        kind
      }
    }
  }
}
`;
async function testQuery() {
    try {
      const response = await axios.post(subgraphUrl, {
        query: TestQuery,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data.data;
      console.log('data:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error Testing:', error);

    }
}

module.exports = {
  getFullTickData,
  searchPools,
  getTokenPools,
  testQuery
};