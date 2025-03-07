const axios = require('axios');

const subgraphUrl = 'https://gateway.thegraph.com/api/?/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV';
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
  console.log("---------------------------",response.data)
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
    console.log('Pool search results:', data);
    return data;
  } catch (error) {
    console.error('Error fetching pools:', error);
    throw error;
  }
}

exports.getFullTickData = getFullTickData;
exports.searchPools = searchPools;