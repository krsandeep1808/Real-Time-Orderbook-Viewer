export interface OrderBookEntry {
  price: number;
  quantity: number;
  total?: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export interface MarketData {
  symbol: string;
  venue: string;
  orderbook: OrderBook;
  lastUpdate: number;
}

export interface SimulatedOrder {
  venue: string;
  symbol: string;
  orderType: 'market' | 'limit';
  side: 'buy' | 'sell';
  price?: number;
  quantity: number;
  timing: 'immediate' | '5s' | '10s' | '30s';
}

export interface OrderPlacement {
  position: number;
  fillPercentage: number;
  marketImpact: number;
  slippage: number;
  timeToFill?: number;
}

export interface VenueConfig {
  name: string;
  websocketUrl: string;
  restApiUrl: string;
  symbols: string[];
}
