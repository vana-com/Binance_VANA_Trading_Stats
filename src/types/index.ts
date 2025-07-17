export type OrderBookLevel = {
  price: number;
  size: number;
  total: number; // cumulative size
};

export type ExchangeData = {
  exchange: string;
  symbol: string;
  price: number;
  quoteVolume: number;
  midPrice: number;
  depthUSD: {
    bids: number;
    asks: number;
  };
  lowLiquidity: {
    bids: boolean;
    asks: boolean;
  };
  orderBook: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
};

export type CrossExchangeArbitrage = {
  buyOn: string;
  sellOn: string;
  profit: number;
}

export type DashboardData = {
  exchangeData: ExchangeData[];
  arbitrage: CrossExchangeArbitrage[];
};

// --- Deprecated Types ---
export type BinancePrice = {
  symbol: string;
  price: string;
};

export type Binance24hrTicker = {
    symbol: string;
    quoteVolume: string;
}

export type BinanceDepth = {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
};

export type LiquidityData = ExchangeData; // Alias for backward compatibility if needed anywhere

export type PairArbitrage = {
  pair: [string, string];
  spread: number;
};

export type TriangularArbitrage = {
  path: string[];
  profit: number;
};
