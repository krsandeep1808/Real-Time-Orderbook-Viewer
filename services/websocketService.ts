import { MarketData, OrderBook, VenueConfig } from '@/types';

export class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private onData: (data: MarketData) => void) {}

  connect(venue: string, symbol: string) {
    const key = `${venue}-${symbol}`;
    
    if (this.connections.has(key)) {
      return;
    }

    try {
      const ws = this.createConnection(venue, symbol);
      this.connections.set(key, ws);
      this.reconnectAttempts.set(key, 0);
    } catch (error) {
      console.error(`Failed to connect to ${venue} for ${symbol}:`, error);
      this.handleReconnect(venue, symbol);
    }
  }

  private createConnection(venue: string, symbol: string): WebSocket {
    const config = this.getVenueConfig(venue);
    const ws = new WebSocket(config.websocketUrl);

    ws.onopen = () => {
      console.log(`Connected to ${venue} WebSocket for ${symbol}`);
      this.subscribeToOrderbook(ws, venue, symbol);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const marketData = this.parseOrderbookData(data, venue, symbol);
        if (marketData) {
          this.onData(marketData);
        }
      } catch (error) {
        console.error(`Error parsing data from ${venue}:`, error);
      }
    };

    ws.onclose = () => {
      console.log(`Disconnected from ${venue} WebSocket for ${symbol}`);
      this.handleReconnect(venue, symbol);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${venue}-${symbol}:`, error);
    };

    return ws;
  }

  private subscribeToOrderbook(ws: WebSocket, venue: string, symbol: string) {
    let subscribeMessage: any;

    switch (venue.toLowerCase()) {
      case 'okx':
        subscribeMessage = {
          op: 'subscribe',
          args: [{
            channel: 'books',
            instId: symbol
          }]
        };
        break;
      case 'bybit':
        subscribeMessage = {
          op: 'subscribe',
          args: [`orderbook.25.${symbol}`]
        };
        break;
      case 'deribit':
        subscribeMessage = {
          jsonrpc: '2.0',
          method: 'public/subscribe',
          id: 1,
          params: {
            channels: [`book.${symbol}.none.10.100ms`]
          }
        };
        break;
      default:
        console.error(`Unknown venue: ${venue}`);
        return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(subscribeMessage));
    }
  }

  private parseOrderbookData(data: any, venue: string, symbol: string): MarketData | null {
    try {
      let orderbook: OrderBook;

      switch (venue.toLowerCase()) {
        case 'okx':
          if (data.data && data.data[0]) {
            const book = data.data[0];
            orderbook = {
              bids: book.bids.slice(0, 15).map(([price, quantity]: [string, string]) => ({
                price: parseFloat(price),
                quantity: parseFloat(quantity)
              })),
              asks: book.asks.slice(0, 15).map(([price, quantity]: [string, string]) => ({
                price: parseFloat(price),
                quantity: parseFloat(quantity)
              })),
              timestamp: parseInt(book.ts)
            };
          } else {
            return null;
          }
          break;

        case 'bybit':
          if (data.data) {
            orderbook = {
              bids: data.data.b.slice(0, 15).map(([price, quantity]: [string, string]) => ({
                price: parseFloat(price),
                quantity: parseFloat(quantity)
              })),
              asks: data.data.a.slice(0, 15).map(([price, quantity]: [string, string]) => ({
                price: parseFloat(price),
                quantity: parseFloat(quantity)
              })),
              timestamp: data.ts
            };
          } else {
            return null;
          }
          break;

        case 'deribit':
          if (data.params && data.params.data) {
            const book = data.params.data;
            orderbook = {
              bids: book.bids.slice(0, 15).map(([price, quantity]: [number, number]) => ({
                price,
                quantity
              })),
              asks: book.asks.slice(0, 15).map(([price, quantity]: [number, number]) => ({
                price,
                quantity
              })),
              timestamp: book.timestamp
            };
          } else {
            return null;
          }
          break;

        default:
          return null;
      }

      return {
        symbol,
        venue,
        orderbook,
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error(`Error parsing ${venue} data:`, error);
      return null;
    }
  }

  private handleReconnect(venue: string, symbol: string) {
    const key = `${venue}-${symbol}`;
    const attempts = this.reconnectAttempts.get(key) || 0;

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(key, attempts + 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect to ${venue} (attempt ${attempts + 1})`);
        this.connect(venue, symbol);
      }, this.reconnectDelay * Math.pow(2, attempts));
    } else {
      console.error(`Max reconnection attempts reached for ${venue}-${symbol}`);
    }
  }

  private getVenueConfig(venue: string): VenueConfig {
    const configs: Record<string, VenueConfig> = {
      okx: {
        name: 'OKX',
        websocketUrl: 'wss://ws.okx.com:8443/ws/v5/public',
        restApiUrl: 'https://www.okx.com',
        symbols: ['BTC-USDT', 'ETH-USDT']
      },
      bybit: {
        name: 'Bybit',
        websocketUrl: 'wss://stream.bybit.com/v5/public/spot',
        restApiUrl: 'https://api.bybit.com',
        symbols: ['BTCUSDT', 'ETHUSDT']
      },
      deribit: {
        name: 'Deribit',
        websocketUrl: 'wss://www.deribit.com/ws/api/v2',
        restApiUrl: 'https://www.deribit.com',
        symbols: ['BTC-PERPETUAL', 'ETH-PERPETUAL']
      }
    };

    return configs[venue.toLowerCase()] || configs.okx;
  }

  disconnect(venue?: string, symbol?: string) {
    if (venue && symbol) {
      const key = `${venue}-${symbol}`;
      const ws = this.connections.get(key);
      if (ws) {
        ws.close();
        this.connections.delete(key);
        this.reconnectAttempts.delete(key);
      }
    } else {
      // Disconnect all
      this.connections.forEach((ws) => ws.close());
      this.connections.clear();
      this.reconnectAttempts.clear();
    }
  }
}
