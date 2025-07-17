import type { ExchangeData, VanaPairData, DashboardData, CrossExchangeArbitrage } from "@/types";

const BINANCE_SYMBOLS = ['VANAUSDT', 'VANAUSDC', 'VANAFDUSD'];
const VANA_USDT_SYMBOL = 'VANAUSDT';
const EXCHANGES = ['Binance', 'MEXC', 'Bitget', 'Bybit'];
const DEPTH_LIMIT = 20;
const DEPTH_BAND_PERCENT = 0.02; // ±2%
const LOW_LIQUIDITY_THRESHOLD = 60000; // $60,000
const TAKER_FEE = 0.001; // 0.1% Taker fee

// Helper to handle API requests and errors
async function fetchAPI<T>(url: string, exchangeName: string): Promise<T> {
    try {
        const response = await fetch(url, { next: { revalidate: 0 } });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error fetching from ${exchangeName} (${response.status}): ${errorBody}`);
            throw new Error(`Failed to fetch data from ${exchangeName}: ${response.statusText || response.status}`);
        }
        return response.json();
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Network error or issue connecting to ${exchangeName} API: ${error.message}`);
            throw new Error(`Could not connect to ${exchangeName}.`);
        }
        throw new Error(`An unknown error occurred while fetching from ${exchangeName}.`);
    }
}

// --- Binance ---
const getBinancePairData = async (symbol: string): Promise<VanaPairData> => {
    const baseUrl = 'https://api.binance.com/api/v3';
    const [priceData, tickerData, depthData] = await Promise.all([
        fetchAPI<{ price: string }>(`${baseUrl}/ticker/price?symbol=${symbol}`, `Binance-${symbol}`),
        fetchAPI<{ quoteVolume: string }>(`${baseUrl}/ticker/24hr?symbol=${symbol}`, `Binance-${symbol}`),
        fetchAPI<{ bids: [string, string][], asks: [string, string][] }>(`${baseUrl}/depth?symbol=${symbol}&limit=${DEPTH_LIMIT}`, `Binance-${symbol}`)
    ]);
    
    const bids = depthData.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    
    return processPairData('Binance', symbol, parseFloat(priceData.price), parseFloat(tickerData.quoteVolume), bids, asks);
}

const getBinanceData = async (): Promise<ExchangeData> => {
    const pairPromises = BINANCE_SYMBOLS.map(symbol => getBinancePairData(symbol).catch(e => {
        console.error(`Could not fetch ${symbol} from Binance`, e);
        return null; // Return null on failure for a specific pair
    }));
    const pairs = (await Promise.all(pairPromises)).filter((p): p is VanaPairData => p !== null);
    return { exchange: 'Binance', pairs };
};


// --- MEXC ---
const getMexcData = async (): Promise<ExchangeData> => {
    const baseUrl = 'https://api.mexc.com/api/v3';
    const symbol = VANA_USDT_SYMBOL;
    const [tickerData, depthData] = await Promise.all([
        fetchAPI<{ lastPrice: string, quoteVolume: string }[]>(`${baseUrl}/ticker/24hr?symbol=${symbol}`, 'MEXC'),
        fetchAPI<{ bids: [string, string][], asks: [string, string][] }>(`${baseUrl}/depth?symbol=${symbol}&limit=${DEPTH_LIMIT}`, 'MEXC')
    ]);

    const price = parseFloat(tickerData[0].lastPrice);
    const quoteVolume = parseFloat(tickerData[0].quoteVolume);
    const bids = depthData.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const pairData = processPairData('MEXC', symbol, price, quoteVolume, bids, asks);
    return { exchange: 'MEXC', pairs: [pairData] };
};

// --- Bitget ---
const getBitgetData = async (): Promise<ExchangeData> => {
    const v2BaseUrl = 'https://api.bitget.com/api/v2/spot/market';
    const v1BaseUrl = 'https://api.bitget.com/api/spot/v1/market';
    const symbol = VANA_USDT_SYMBOL;
    
    const [tickerData, depthData, volumeData] = await Promise.all([
       fetchAPI<{ data: { lastPr: string }[] }>(`${v2BaseUrl}/tickers?symbol=${symbol}`, 'Bitget-v2'),
       fetchAPI<{ data: { bids: [string, string][], asks: [string, string][] } }>(`${v2BaseUrl}/orderbook?symbol=${symbol}&limit=${DEPTH_LIMIT}`, 'Bitget-v2'),
       fetchAPI<{ data: { quoteVol: string } }>(`${v1BaseUrl}/ticker?symbol=${symbol}_SPBL`, 'Bitget-v1')
    ]);
    
    const price = parseFloat(tickerData.data[0].lastPr);
    const quoteVolume = parseFloat(volumeData.data.quoteVol);
    const bids = depthData.data.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.data.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const pairData = processPairData('Bitget', symbol, price, quoteVolume, bids, asks);
    return { exchange: 'Bitget', pairs: [pairData] };
};

// --- Bybit ---
const getBybitData = async (): Promise<ExchangeData> => {
    const baseUrl = 'https://api.bybit.com/v5/market';
    const symbol = VANA_USDT_SYMBOL;
     const [tickers, depthData] = await Promise.all([
        fetchAPI<{ result: { list: { lastPrice: string, volume24h: string }[] } }>(`${baseUrl}/tickers?category=spot&symbol=${symbol}`, 'Bybit'),
        fetchAPI<{ result: { b: [string, string][], a: [string, string][] } }>(`${baseUrl}/orderbook?category=spot&symbol=${symbol}&limit=${DEPTH_LIMIT}`, 'Bybit')
    ]);

    const price = parseFloat(tickers.result.list[0].lastPrice);
    const quoteVolume = parseFloat(tickers.result.list[0].volume24h);
    const bids = depthData.result.b.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.result.a.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const pairData = processPairData('Bybit', symbol, price, quoteVolume, bids, asks);
    return { exchange: 'Bybit', pairs: [pairData] };
};

// Generic processing function for a single pair
function processPairData(exchange: string, symbol: string, price: number, quoteVolume: number, bids: {price: number, size: number}[], asks: {price: number, size: number}[]): VanaPairData {
    const sortedBids = bids.sort((a, b) => b.price - a.price);
    const sortedAsks = asks.sort((a, b) => a.price - b.price);

    const midPrice = (sortedBids[0]?.price + sortedAsks[0]?.price) / 2 || price;
    const lowerBound = midPrice * (1 - DEPTH_BAND_PERCENT);
    const upperBound = midPrice * (1 + DEPTH_BAND_PERCENT);
    
    const calculateDepthUSD = (levels: {price: number, size: number}[]) => 
        levels
            .filter(level => level.price >= lowerBound && level.price <= upperBound)
            .reduce((sum, level) => sum + (level.price * level.size), 0);

    const depthUSDBids = calculateDepthUSD(sortedBids);
    const depthUSDAsks = calculateDepthUSD(sortedAsks);

    return {
        exchange,
        symbol,
        price,
        quoteVolume,
        midPrice,
        depthUSD: { bids: depthUSDBids, asks: depthUSDAsks },
        lowLiquidity: {
            bids: depthUSDBids < LOW_LIQUIDITY_THRESHOLD,
            asks: depthUSDAsks < LOW_LIQUIDITY_THRESHOLD,
        },
        orderBook: {
            bids: sortedBids,
            asks: sortedAsks,
        }
    };
}


// Main function to get all data and calculate arbitrage
export async function getDashboardData(): Promise<DashboardData> {
    const promises = [
        getBinanceData(),
        getMexcData(),
        getBitgetData(),
        getBybitData(),
    ];
    
    const results = await Promise.allSettled(promises);

    const exchangeData: ExchangeData[] = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.pairs.length > 0) {
            exchangeData.push(result.value);
        } else {
            console.error(`Failed to load data for ${EXCHANGES[index]}:`, result.status === 'rejected' ? result.reason : 'No pairs returned');
        }
    });
    
    const arbitrage: CrossExchangeArbitrage[] = [];
    // Extract all VANA/USDT pairs for arbitrage calculation
    const vanaUsdtPairs = exchangeData
        .map(ex => ex.pairs.find(p => p.symbol === VANA_USDT_SYMBOL))
        .filter((p): p is VanaPairData => p !== undefined);


    if (vanaUsdtPairs.length > 1) {
        for (let i = 0; i < vanaUsdtPairs.length; i++) {
            for (let j = 0; j < vanaUsdtPairs.length; j++) {
                if (i === j) continue;

                const buyPair = vanaUsdtPairs[i];
                const sellPair = vanaUsdtPairs[j];
                
                const buyPrice = buyPair.orderBook.asks[0]?.price;
                const sellPrice = sellPair.orderBook.bids[0]?.price;

                if (buyPrice && sellPrice) {
                    const grossProfit = (sellPrice / buyPrice) - 1;
                    const netProfit = grossProfit - (TAKER_FEE * 2);

                    if (netProfit > 0) {
                        arbitrage.push({
                            buyOn: buyPair.exchange,
                            sellOn: sellPair.exchange,
                            profit: netProfit,
                        });
                    }
                }
            }
        }
    }

    return { exchangeData, arbitrage };
}
