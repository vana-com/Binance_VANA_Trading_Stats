import type { BinancePrice, BinanceDepth, DashboardData, LiquidityData, PairArbitrage, TriangularArbitrage, OrderBookLevel } from "@/types";

const SYMBOLS = ['VANAUSDT', 'VANAUSDC', 'VANAFDUSD'];
const API_BASE = 'https://api.binance.com/api/v3';
const DEPTH_LIMIT = 20;
const DEPTH_BAND_PERCENT = 0.02; // ±2%
const LOW_LIQUIDITY_THRESHOLD = 60000; // $60,000
const TAKER_FEE = 0.001; // 0.1%
const PAIR_ARBITRAGE_THRESHOLD = 0; // 0% - Return all, filter on client
const TRIANGULAR_ARBITRAGE_THRESHOLD = 0; // 0% - Return all, filter on client

async function fetchData<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { next: { revalidate: 0 } });
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limited by Binance API. Please wait a moment before refreshing.");
      }
      throw new Error(`Failed to fetch data from Binance: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error) {
        throw new Error(`Network error or issue connecting to Binance API: ${error.message}`);
    }
    throw new Error('An unknown error occurred during data fetching.');
  }
}

const getPrice = (symbol: string) => fetchData<BinancePrice>(`/ticker/price?symbol=${symbol}`);
const getDepth = (symbol: string) => fetchData<BinanceDepth>(`/depth?symbol=${symbol}&limit=${DEPTH_LIMIT}`);

function processOrderBook(orders: [string, string][], isBids: boolean): OrderBookLevel[] {
    const processed = orders.map(([price, size]) => ({
        price: parseFloat(price),
        size: parseFloat(size),
    }));

    // Sort bids descending, asks ascending by price
    processed.sort((a, b) => isBids ? b.price - a.price : a.price - b.price);

    let cumulativeSize = 0;
    return processed.map(order => {
        cumulativeSize += order.size;
        return { ...order, total: cumulativeSize };
    });
}


export async function getDashboardData(): Promise<DashboardData> {
  const pricePromises = SYMBOLS.map(getPrice);
  const depthPromises = SYMBOLS.map(getDepth);

  const allPrices = await Promise.all(pricePromises);
  const allDepths = await Promise.all(depthPromises);

  const priceMap = new Map(allPrices.map(p => [p.symbol, parseFloat(p.price)]));

  // 1. Process Liquidity and Depth
  const liquidityData: LiquidityData[] = SYMBOLS.map((symbol, index) => {
    const depth = allDepths[index];
    const price = priceMap.get(symbol) ?? 0;
    
    const bids = processOrderBook(depth.bids, true);
    const asks = processOrderBook(depth.asks, false);

    const midPrice = (bids[0]?.price + asks[0]?.price) / 2 || price;
    const lowerBound = midPrice * (1 - DEPTH_BAND_PERCENT);
    const upperBound = midPrice * (1 + DEPTH_BAND_PERCENT);

    const calculateDepthUSD = (levels: OrderBookLevel[]) => 
      levels
        .filter(level => level.price >= lowerBound && level.price <= upperBound)
        .reduce((sum, level) => sum + (level.price * level.size), 0);
    
    const depthUSDBids = calculateDepthUSD(bids);
    const depthUSDAsks = calculateDepthUSD(asks);

    return {
      symbol,
      price,
      midPrice,
      depthUSD: { bids: depthUSDBids, asks: depthUSDAsks },
      lowLiquidity: {
        bids: depthUSDBids < LOW_LIQUIDITY_THRESHOLD,
        asks: depthUSDAsks < LOW_LIQUIDITY_THRESHOLD,
      },
      orderBook: { bids, asks },
    };
  });

  const liquidityMap = new Map(liquidityData.map(d => [d.symbol, d]));

  // 2. Pair Arbitrage
  const pairArbitrage: PairArbitrage[] = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    for (let j = i + 1; j < SYMBOLS.length; j++) {
      const symbolA = SYMBOLS[i];
      const symbolB = SYMBOLS[j];
      const dataA = liquidityMap.get(symbolA);
      const dataB = liquidityMap.get(symbolB);

      if (dataA && dataB && dataB.midPrice > 0) {
        const grossSpread = Math.abs(dataA.midPrice / dataB.midPrice - 1);
        const netSpread = grossSpread - (TAKER_FEE * 2);
        if (netSpread > PAIR_ARBITRAGE_THRESHOLD) {
          pairArbitrage.push({ pair: [symbolA, symbolB], spread: netSpread });
        }
      }
    }
  }

  // 3. Triangular Arbitrage
  const triangularArbitrage: TriangularArbitrage[] = [];
  const vanaUsdt = liquidityMap.get('VANAUSDT');
  const vanaUsdc = liquidityMap.get('VANAUSDC');
  const vanaFdusd = liquidityMap.get('VANAFDUSD');

  if (vanaUsdt && vanaUsdc && vanaFdusd) {
    // We should use best ask (to buy) and best bid (to sell) for more accurate calculation
    const askUsdt = vanaUsdt.orderBook.asks[0]?.price;
    const bidUsdt = vanaUsdt.orderBook.bids[0]?.price;
    const askUsdc = vanaUsdc.orderBook.asks[0]?.price;
    const bidUsdc = vanaUsdc.orderBook.bids[0]?.price;
    const askFdusd = vanaFdusd.orderBook.asks[0]?.price;
    const bidFdusd = vanaFdusd.orderBook.bids[0]?.price;

    if (askUsdt && bidUsdt && askUsdc && bidUsdc && askFdusd && bidFdusd) {
        const paths: { name: string, path: string[], calc: number }[] = [
            // Path 1: Start with USD-like asset, buy VANA, sell for other USD-like, convert back
            { name: 'USDT -> VANA -> USDC', path: ['USDT', 'VANA', 'USDC', 'USDT'], calc: (1 / askUsdt) * bidUsdc /* * (1/askUsdtUsdc) */ },
            { name: 'USDC -> VANA -> USDT', path: ['USDC', 'VANA', 'USDT', 'USDC'], calc: (1 / askUsdc) * bidUsdt /* * (1/askUsdcUsdt) */ },
            { name: 'USDT -> VANA -> FDUSD', path: ['USDT', 'VANA', 'FDUSD', 'USDT'], calc: (1 / askUsdt) * bidFdusd /* * (1/askUsdtFdusd) */ },
            { name: 'FDUSD -> VANA -> USDT', path: ['FDUSD', 'VANA', 'USDT', 'FDUSD'], calc: (1 / askFdusd) * bidUsdt /* * (1/askFdusdUsdt) */ },
            { name: 'USDC -> VANA -> FDUSD', path: ['USDC', 'VANA', 'FDUSD', 'USDC'], calc: (1 / askUsdc) * bidFdusd /* * (1/askUsdcFdusd) */ },
            { name: 'FDUSD -> VANA -> USDC', path: ['FDUSD', 'VANA', 'USDC', 'FDUSD'], calc: (1 / askFdusd) * bidUsdc /* * (1/askFdusdVana) */ },
        ];
        
        // This example assumes a 1:1 conversion for stablecoins for simplicity.
        // A real-world bot would fetch live prices for USDC/USDT, FDUSD/USDT etc.
        paths.forEach(p => {
            const grossProfit = p.calc - 1;
            const netProfit = grossProfit - (TAKER_FEE * 3); // 3 trades in the cycle

            if (netProfit > TRIANGULAR_ARBITRAGE_THRESHOLD) {
                triangularArbitrage.push({
                    path: p.path,
                    profit: netProfit,
                });
            }
        });
    }
  }


  return { liquidityData, pairArbitrage, triangularArbitrage };
}
