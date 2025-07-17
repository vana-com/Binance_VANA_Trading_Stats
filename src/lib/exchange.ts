import type { ExchangeData, OrderBookLevel, DashboardData, CrossExchangeArbitrage } from "@/types";

const SYMBOL = 'VANAUSDT';
const EXCHANGES = ['Binance', 'MEXC', 'Bitget', 'Bybit'];
const DEPTH_LIMIT = 20;
const DEPTH_BAND_PERCENT = 0.02; // ±2%
const LOW_LIQUIDITY_THRESHOLD = 60000; // $60,000
const TAKER_FEE = 0.001; // 0.1% Taker fee
const ARB_THRESHOLD = 0.0025; // 0.25%

// Helper to handle API requests and errors
async function fetchAPI<T>(url: string, exchangeName: string): Promise<T> {
    try {
        const response = await fetch(url, { next: { revalidate: 0 } });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error fetching from ${exchangeName} (${response.status}): ${errorBody}`);
            throw new Error(`Failed to fetch data from ${exchangeName}: ${response.status}`);
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
const getBinanceData = async (): Promise<ExchangeData> => {
    const baseUrl = 'https://api.binance.com/api/v3';
    const priceData = await fetchAPI<{ price: string }>(`${baseUrl}/ticker/price?symbol=${SYMBOL}`, 'Binance');
    const tickerData = await fetchAPI<{ quoteVolume: string }>(`${baseUrl}/ticker/24hr?symbol=${SYMBOL}`, 'Binance');
    const depthData = await fetchAPI<{ bids: [string, string][], asks: [string, string][] }>(`${baseUrl}/depth?symbol=${SYMBOL}&limit=${DEPTH_LIMIT}`, 'Binance');
    
    const bids = depthData.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    
    return processExchangeData('Binance', SYMBOL, parseFloat(priceData.price), parseFloat(tickerData.quoteVolume), bids, asks);
};

// --- MEXC ---
const getMexcData = async (): Promise<ExchangeData> => {
    const baseUrl = 'https://api.mexc.com/api/v3';
    const priceData = await fetchAPI<{ price: string }>(`${baseUrl}/ticker/price?symbol=${SYMBOL}`, 'MEXC');
    const tickerData = await fetchAPI<{ quoteVolume: string }>(`${baseUrl}/ticker/24hr?symbol=${SYMBOL}`, 'MEXC');
    const depthData = await fetchAPI<{ bids: [string, string][], asks: [string, string][] }>(`${baseUrl}/depth?symbol=${SYMBOL}&limit=${DEPTH_LIMIT}`, 'MEXC');

    const bids = depthData.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));

    return processExchangeData('MEXC', SYMBOL, parseFloat(priceData.price), parseFloat(tickerData.quoteVolume), bids, asks);
};

// --- Bitget ---
const getBitgetData = async (): Promise<ExchangeData> => {
    const baseUrl = 'https://api.bitget.com/api/v2/spot/market';
    const tickerData = await fetchAPI<{ data: { quoteVol: string, openPrice: string }[] }>(`${baseUrl}/tickers?symbol=${SYMBOL}`, 'Bitget');
    const depthData = await fetchAPI<{ data: { bids: [string, string][], asks: [string, string][] } }>(`${baseUrl}/orderbook?symbol=${SYMBOL}&limit=${DEPTH_LIMIT}`, 'Bitget');
    
    const price = parseFloat(tickerData.data[0].openPrice); // Using openPrice as ticker doesn't have lastPrice
    const quoteVolume = parseFloat(tickerData.data[0].quoteVol);
    const bids = depthData.data.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.data.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));

    return processExchangeData('Bitget', SYMBOL, price, quoteVolume, bids, asks);
};

// --- Bybit ---
const getBybitData = async (): Promise<ExchangeData> => {
    const baseUrl = 'https://api.bybit.com/spot/v3/public';
    const priceData = await fetchAPI<{ result: { price: string } }>(`${baseUrl}/quote/ticker/price?symbol=${SYMBOL}`, 'Bybit');
    const tickerData = await fetchAPI<{ result: { quoteVolume: string } }>(`${baseUrl}/quote/ticker/24hr?symbol=${SYMBOL}`, 'Bybit');
    const depthData = await fetchAPI<{ result: { bids: [string, string][], asks: [string, string][] } }>(`${baseUrl}/quote/depth?symbol=${SYMBOL}&limit=${DEPTH_LIMIT}`, 'Bybit');

    const bids = depthData.result.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    const asks = depthData.result.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));

    return processExchangeData('Bybit', SYMBOL, parseFloat(priceData.result.price), parseFloat(tickerData.result.quoteVolume), bids, asks);
};

// Generic processing function
function processExchangeData(exchange: string, symbol: string, price: number, quoteVolume: number, bids: {price: number, size: number}[], asks: {price: number, size: number}[]): ExchangeData {
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
            bids: sortedBids.map(o => ({...o, total: 0})),
            asks: sortedAsks.map(o => ({...o, total: 0})),
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
        if (result.status === 'fulfilled') {
            exchangeData.push(result.value);
        } else {
            console.error(`Failed to load data for ${EXCHANGES[index]}:`, result.reason);
            // Optionally create a placeholder error object for the UI
        }
    });
    
    const arbitrage: CrossExchangeArbitrage[] = [];
    if (exchangeData.length > 1) {
        for (let i = 0; i < exchangeData.length; i++) {
            for (let j = 0; j < exchangeData.length; j++) {
                if (i === j) continue;

                const buyExchange = exchangeData[i];
                const sellExchange = exchangeData[j];
                
                const buyPrice = buyExchange.orderBook.asks[0]?.price; // Price to buy
                const sellPrice = sellExchange.orderBook.bids[0]?.price; // Price to sell

                if (buyPrice && sellPrice) {
                    const grossProfit = (sellPrice / buyPrice) - 1;
                    const netProfit = grossProfit - (TAKER_FEE * 2);

                    if (netProfit > 0) { // Return all positive opportunities
                        arbitrage.push({
                            buyOn: buyExchange.exchange,
                            sellOn: sellExchange.exchange,
                            profit: netProfit,
                        });
                    }
                }
            }
        }
    }

    return { exchangeData, arbitrage };
}
