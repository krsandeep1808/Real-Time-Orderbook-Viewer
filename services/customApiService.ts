import { MarketData, OrderBook, VenueConfig } from '@/types';

// Configuration interface for your custom API
interface CustomApiConfig {
  baseUrl: string;
  websocketUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  endpoints: {
    orderbook: string;
    symbols: string;
    ticker?: string;
  };
}

// Default configuration - Update these with your API details
const DEFAULT_CONFIG: CustomApiConfig = {
  baseUrl: 'https://your-api-domain.com/api/v1',
  websocketUrl: 'wss://your-api-domain.com/ws',
  apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
  headers: {
    'Content-Type': 'application/json',
    // Add your custom headers here
  },
  endpoints: {
    orderbook: '/orderbook/{symbol}',
    symbols: '/symbols',
    ticker: '/ticker/{symbol}'
  }
};

export class CustomApiService {
  private config: CustomApiConfig;
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor(config?: Partial<CustomApiConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Add API key to headers if provided
    if (this.config.apiKey) {
      this.config.headers = {
        ...this.config.headers,
        'Authorization': `Bearer ${this.config.apiKey}`,
        // or 'X-API-Key': this.config.apiKey, // depending on your API
      };
    }
  }

  // REST API Methods
  async fetchOrderbook(symbol: string, venue?: string): Promise<OrderBook | null> {
    try {
      const url = `${this.config.baseUrl}${this.config.endpoints.orderbook.replace('{symbol}', symbol)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.config.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeOrderbookData(data, symbol, venue);
    } catch (error) {
      console.error('Failed to fetch orderbook:', error);
      return null;
    }
  }

  async fetchSymbols(): Promise<string[]> {
    try {
      const url = `${this.config.baseUrl}${this.config.endpoints.symbols}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.config.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeSymbolsData(data);
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
      return [];
    }
  }

  async fetchTicker(symbol: string): Promise<any> {
    try {
      if (!this.config.endpoints.ticker) return null;
      
      const url = `${this.config.baseUrl}${this.config.endpoints.ticker.replace('{symbol}', symbol)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.config.headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch ticker:', error);
      return null;
    }
  }

  // WebSocket Methods
  connectWebSocket(symbol: string, venue: string, onData: (data: MarketData) => void): void {
    if (!this.config.websocketUrl) {
      console.warn('WebSocket URL not configured');
      return;
    }

    const key = `${venue}-${symbol}`;
    
    if (this.wsConnections.has(key)) {
      console.log(`WebSocket already connected for ${key}`);
      return;
    }

    try {
      const ws = new WebSocket(this.config.websocketUrl);
      
      ws.onopen = () => {
        console.log(`Connected to custom WebSocket for ${key}`);
        
        // Send subscription message - customize based on your API
        const subscriptionMessage = {
          action: 'subscribe',
          channel: 'orderbook',
          symbol: symbol,
          venue: venue
        };
        
        ws.send(JSON.stringify(subscriptionMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const marketData = this.normalizeWebSocketData(data, venue, symbol);
          if (marketData) {
            onData(marketData);
          }
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.onclose = () => {
        console.log(`WebSocket disconnected for ${key}`);
        this.wsConnections.delete(key);
        
        // Auto-reconnect after delay
        setTimeout(() => {
          this.connectWebSocket(symbol, venue, onData);
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${key}:`, error);
      };

      this.wsConnections.set(key, ws);
    } catch (error) {
      console.error(`Failed to connect WebSocket for ${key}:`, error);
    }
  }

  disconnectWebSocket(symbol?: string, venue?: string): void {
    if (symbol && venue) {
      const key = `${venue}-${symbol}`;
      const ws = this.wsConnections.get(key);
      if (ws) {
        ws.close();
        this.wsConnections.delete(key);
      }
    } else {
      // Disconnect all
      this.wsConnections.forEach((ws) => ws.close());
      this.wsConnections.clear();
    }
  }

  // Data normalization methods - Customize these based on your API response format
  private normalizeOrderbookData(data: any, symbol: string, venue?: string): OrderBook {
    // Example normalization - adjust based on your API response format
    return {
      bids: this.normalizeOrderbookSide(data.bids || data.bid || []),
      asks: this.normalizeOrderbookSide(data.asks || data.ask || []),
      timestamp: data.timestamp || Date.now()
    };
  }

  private normalizeOrderbookSide(side: any[]): Array<{ price: number; quantity: number }> {
    return side.map(entry => {
      // Handle different possible formats:
      if (Array.isArray(entry)) {
        // Format: [price, quantity]
        return {
          price: parseFloat(entry[0]),
          quantity: parseFloat(entry[1])
        };
      } else if (typeof entry === 'object') {
        // Format: {price: x, quantity: y} or {price: x, size: y, amount: z}
        return {
          price: parseFloat(entry.price || entry.p),
          quantity: parseFloat(entry.quantity || entry.size || entry.amount || entry.q)
        };
      }
      return { price: 0, quantity: 0 };
    }).filter(entry => entry.price > 0 && entry.quantity > 0);
  }

  private normalizeSymbolsData(data: any): string[] {
    // Adjust based on your API response format
    if (Array.isArray(data)) {
      return data.map(item => 
        typeof item === 'string' ? item : (item.symbol || item.name || item.id)
      );
    } else if (data.symbols) {
      return data.symbols;
    } else if (data.data) {
      return data.data;
    }
    return [];
  }

  private normalizeWebSocketData(data: any, venue: string, symbol: string): MarketData | null {
    try {
      // Customize based on your WebSocket message format
      if (data.channel === 'orderbook' && data.symbol === symbol) {
        return {
          symbol,
          venue,
          orderbook: this.normalizeOrderbookData(data.data || data, symbol, venue),
          lastUpdate: Date.now()
        };
      }
      return null;
    } catch (error) {
      console.error('Error normalizing WebSocket data:', error);
      return null;
    }
  }

  // Utility method to test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.config.headers,
      });
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // Method to update configuration at runtime
  updateConfig(newConfig: Partial<CustomApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.apiKey) {
      this.config.headers = {
        ...this.config.headers,
        'Authorization': `Bearer ${newConfig.apiKey}`,
      };
    }
  }
}
