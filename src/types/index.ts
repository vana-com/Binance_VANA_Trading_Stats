export type OrderBookLevel = {
  price: number;
  size: number;
};

export type VanaPairData = {
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

export type ExchangeData = {
  exchange: string;
  pairs: VanaPairData[];
}

export type CrossExchangeArbitrage = {
  buyOn: string;
  buySymbol: string;
  sellOn: string;
  sellSymbol: string;
  profit: number;
}

export type DashboardData = {
  exchangeData: ExchangeData[];
  arbitrage: CrossExchangeArbitrage[];
};

// Deprecated alias for backward compatibility in components
export type LiquidityData = VanaPairData;
