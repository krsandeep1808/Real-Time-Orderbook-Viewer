'use client';

import React, { useState, useEffect, useCallback } from 'react';
import OrderBook from '@/components/OrderBook';
import OrderSimulationForm from '@/components/OrderSimulationForm';
import OrderPlacementVisualization from '@/components/OrderPlacementVisualization';
import VenueSelector from '@/components/VenueSelector';
import { WebSocketService } from '@/services/websocketService';
import { CustomApiService } from '@/services/customApiService';
import { OrderSimulationService } from '@/services/orderSimulationService';
import { MarketData, SimulatedOrder, OrderPlacement, OrderBook as OrderBookType } from '@/types';

// Mock data for demonstration since WebSocket connections may not work in demo
const createMockOrderbook = (): OrderBookType => ({
  bids: Array.from({ length: 15 }, (_, i) => ({
    price: 50000 - (i * 10),
    quantity: Math.random() * 5 + 0.1
  })),
  asks: Array.from({ length: 15 }, (_, i) => ({
    price: 50010 + (i * 10),
    quantity: Math.random() * 5 + 0.1
  })),
  timestamp: Date.now()
});

const mockMarketData: Record<string, MarketData> = {
  'okx-BTC-USDT': {
    symbol: 'BTC-USDT',
    venue: 'okx',
    orderbook: createMockOrderbook(),
    lastUpdate: Date.now()
  },
  'okx-ETH-USDT': {
    symbol: 'ETH-USDT',
    venue: 'okx',
    orderbook: {
      ...createMockOrderbook(),
      bids: createMockOrderbook().bids.map(b => ({ ...b, price: b.price * 0.06 })),
      asks: createMockOrderbook().asks.map(a => ({ ...a, price: a.price * 0.06 }))
    },
    lastUpdate: Date.now()
  },
  'bybit-BTCUSDT': {
    symbol: 'BTCUSDT',
    venue: 'bybit',
    orderbook: createMockOrderbook(),
    lastUpdate: Date.now()
  },
  'bybit-ETHUSDT': {
    symbol: 'ETHUSDT',
    venue: 'bybit',
    orderbook: {
      ...createMockOrderbook(),
      bids: createMockOrderbook().bids.map(b => ({ ...b, price: b.price * 0.06 })),
      asks: createMockOrderbook().asks.map(a => ({ ...a, price: a.price * 0.06 }))
    },
    lastUpdate: Date.now()
  },
  'deribit-BTC-PERPETUAL': {
    symbol: 'BTC-PERPETUAL',
    venue: 'deribit',
    orderbook: createMockOrderbook(),
    lastUpdate: Date.now()
  },
  'deribit-ETH-PERPETUAL': {
    symbol: 'ETH-PERPETUAL',
    venue: 'deribit',
    orderbook: {
      ...createMockOrderbook(),
      bids: createMockOrderbook().bids.map(b => ({ ...b, price: b.price * 0.06 })),
      asks: createMockOrderbook().asks.map(a => ({ ...a, price: a.price * 0.06 }))
    },
    lastUpdate: Date.now()
  }
};

export default function Home() {
  const [selectedVenue, setSelectedVenue] = useState<string>('okx');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC-USDT');
  const [marketData, setMarketData] = useState<Record<string, MarketData>>(mockMarketData);
  const [simulatedOrder, setSimulatedOrder] = useState<SimulatedOrder | null>(null);
  const [orderPlacement, setOrderPlacement] = useState<OrderPlacement | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const [customApiService, setCustomApiService] = useState<CustomApiService | null>(null);
  const [useCustomApi, setUseCustomApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<string>('testing');

  // Function to fetch orderbook data from custom API
  const fetchCustomOrderbook = async (symbol: string, venue: string, apiService: CustomApiService) => {
    try {
      const orderbook = await apiService.fetchOrderbook(symbol, venue);
      if (orderbook) {
        const key = `${venue}-${symbol}`;
        setMarketData(prev => ({
          ...prev,
          [key]: {
            symbol,
            venue,
            orderbook,
            lastUpdate: Date.now()
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch custom orderbook:', error);
    }
  };

  // Initialize services
  useEffect(() => {
    // Check if custom API is enabled
    const customApiEnabled = process.env.NEXT_PUBLIC_ENABLE_CUSTOM_API === 'true';
    
    if (customApiEnabled && process.env.NEXT_PUBLIC_API_BASE_URL) {
      // Initialize custom API service
      const customApi = new CustomApiService({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        websocketUrl: process.env.NEXT_PUBLIC_WS_URL,
        apiKey: process.env.NEXT_PUBLIC_API_KEY,
        endpoints: {
          orderbook: process.env.NEXT_PUBLIC_ORDERBOOK_ENDPOINT || '/orderbook/{symbol}',
          symbols: process.env.NEXT_PUBLIC_SYMBOLS_ENDPOINT || '/symbols',
          ticker: process.env.NEXT_PUBLIC_TICKER_ENDPOINT || '/ticker/{symbol}'
        }
      });
      
      setCustomApiService(customApi);
      
      // Test API connection
      customApi.testConnection().then(isConnected => {
        if (isConnected) {
          setUseCustomApi(true);
          setApiStatus('connected');
          console.log('Custom API connected successfully');
          
          // Connect to WebSocket if available
          if (process.env.NEXT_PUBLIC_WS_URL) {
            customApi.connectWebSocket(selectedSymbol, selectedVenue, (data: MarketData) => {
              const key = `${data.venue}-${data.symbol}`;
              setMarketData(prev => ({
                ...prev,
                [key]: data
              }));
            });
          }
          
          // Fetch initial orderbook data
          fetchCustomOrderbook(selectedSymbol, selectedVenue, customApi);
        } else {
          setApiStatus('failed');
          console.log('Custom API connection failed, using mock data');
        }
      });
    }
    
    // Initialize standard WebSocket service as fallback
    const service = new WebSocketService((data: MarketData) => {
      if (!useCustomApi) {
        const key = `${data.venue}-${data.symbol}`;
        setMarketData(prev => ({
          ...prev,
          [key]: data
        }));
      }
    });

    setWsService(service);

    // Try to connect to exchange WebSockets if not using custom API
    if (!customApiEnabled) {
      try {
        service.connect(selectedVenue, selectedSymbol);
      } catch (error) {
        console.log('WebSocket connection failed, using mock data');
      }
    }

    return () => {
      service.disconnect();
      if (customApiService) {
        customApiService.disconnectWebSocket();
      }
    };
  }, []);

  // Update WebSocket connections when venue/symbol changes
  useEffect(() => {
    if (wsService) {
      try {
        wsService.connect(selectedVenue, selectedSymbol);
      } catch (error) {
        console.log('WebSocket connection failed, using mock data');
      }
    }
  }, [selectedVenue, selectedSymbol, wsService]);

  // Simulate real-time updates for mock data
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          // Small random updates to prices and quantities
          const data = updated[key];
          const newOrderbook = {
            ...data.orderbook,
            bids: data.orderbook.bids.map(bid => ({
              ...bid,
              price: bid.price + (Math.random() - 0.5) * 2,
              quantity: Math.max(0.01, bid.quantity + (Math.random() - 0.5) * 0.5)
            })),
            asks: data.orderbook.asks.map(ask => ({
              ...ask,
              price: ask.price + (Math.random() - 0.5) * 2,
              quantity: Math.max(0.01, ask.quantity + (Math.random() - 0.5) * 0.5)
            })),
            timestamp: Date.now()
          };
          
          updated[key] = {
            ...data,
            orderbook: newOrderbook,
            lastUpdate: Date.now()
          };
        });
        return updated;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const handleVenueChange = useCallback((venue: string, symbol: string) => {
    setSelectedVenue(venue);
    setSelectedSymbol(symbol);
    
    // Clear previous simulation when switching venues
    setSimulatedOrder(null);
    setOrderPlacement(null);
  }, []);

  const handleOrderSubmit = useCallback(async (order: SimulatedOrder) => {
    setIsSimulating(true);
    
    try {
      // Simulate processing delay based on timing
      const delay = {
        'immediate': 0,
        '5s': 5000,
        '10s': 10000,
        '30s': 30000
      }[order.timing] || 0;

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 2000))); // Cap demo delay at 2s
      }

      const key = `${order.venue}-${order.symbol}`;
      const currentMarketData = marketData[key];
      
      if (currentMarketData) {
        const placement = OrderSimulationService.simulateOrderPlacement(
          order, 
          currentMarketData.orderbook
        );
        
        setSimulatedOrder(order);
        setOrderPlacement(placement);
      } else {
        console.error('No market data available for:', key);
      }
    } catch (error) {
      console.error('Order simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [marketData]);

  const currentMarketData = marketData[`${selectedVenue}-${selectedSymbol}`];

  return (
    <div className="space-y-6">
      {/* Venue Selection */}
      <VenueSelector
        selectedVenue={selectedVenue}
        selectedSymbol={selectedSymbol}
        onVenueChange={handleVenueChange}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orderbook Display */}
        <div className="lg:col-span-2">
          {currentMarketData ? (
            <OrderBook
              orderbook={currentMarketData.orderbook}
              venue={selectedVenue}
              symbol={selectedSymbol}
              simulatedOrder={simulatedOrder}
              orderPlacement={orderPlacement}
            />
          ) : (
            <div className="bg-bg-card rounded-lg border border-border-dark p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading orderbook data...</p>
            </div>
          )}
        </div>

        {/* Order Simulation Form */}
        <div>
          <OrderSimulationForm
            onOrderSubmit={handleOrderSubmit}
            currentVenue={selectedVenue}
            currentSymbol={selectedSymbol}
            isLoading={isSimulating}
          />
        </div>
      </div>

      {/* Order Placement Visualization */}
      {simulatedOrder && orderPlacement && (
        <div className="mt-6">
          <OrderPlacementVisualization
            simulatedOrder={simulatedOrder}
            orderPlacement={orderPlacement}
          />
        </div>
      )}

      {/* Market Statistics */}
      {currentMarketData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-bg-card rounded-lg border border-border-dark p-4">
            <h4 className="text-sm text-gray-400 mb-2">Best Bid</h4>
            <div className="text-lg font-mono text-buy">
              ${currentMarketData.orderbook.bids[0]?.price.toFixed(2) || 'N/A'}
            </div>
          </div>
          
          <div className="bg-bg-card rounded-lg border border-border-dark p-4">
            <h4 className="text-sm text-gray-400 mb-2">Best Ask</h4>
            <div className="text-lg font-mono text-sell">
              ${currentMarketData.orderbook.asks[0]?.price.toFixed(2) || 'N/A'}
            </div>
          </div>
          
          <div className="bg-bg-card rounded-lg border border-border-dark p-4">
            <h4 className="text-sm text-gray-400 mb-2">Spread</h4>
            <div className="text-lg font-mono text-white">
              {OrderSimulationService.calculateSpread(currentMarketData.orderbook).toFixed(3)}%
            </div>
          </div>
          
          <div className="bg-bg-card rounded-lg border border-border-dark p-4">
            <h4 className="text-sm text-gray-400 mb-2">Imbalance</h4>
            <div className={`text-lg font-mono ${
              OrderSimulationService.calculateOrderbookImbalance(currentMarketData.orderbook) > 0 
                ? 'text-buy' : 'text-sell'
            }`}>
              {OrderSimulationService.calculateOrderbookImbalance(currentMarketData.orderbook).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
