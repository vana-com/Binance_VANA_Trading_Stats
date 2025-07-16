export type BinancePrice = {
  symbol: string;
  price: string;
};

export type BinanceDepth = {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
};

export type OrderBookLevel = {
  price: number;
  size: number;
  total: number; // cumulative size
};

export type LiquidityData = {
  symbol: string;
  price: number;
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

export type PairArbitrage = {
  pair: [string, string];
  spread: number;
};

export type TriangularArbitrage = {
  path: string[];
  profit: number;
};

export type DashboardData = {
  liquidityData: LiquidityData[];
  pairArbitrage: PairArbitrage[];
  triangularArbitrage: TriangularArbitrage[];
};
