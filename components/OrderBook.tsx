'use client';

import React from 'react';
import { OrderBook as OrderBookType, OrderBookEntry, SimulatedOrder, OrderPlacement } from '@/types';
import { OrderSimulationService } from '@/services/orderSimulationService';

interface OrderBookProps {
  orderbook: OrderBookType;
  venue: string;
  symbol: string;
  simulatedOrder: SimulatedOrder | null;
  orderPlacement: OrderPlacement | null;
}

interface OrderRowProps {
  entry: OrderBookEntry;
  side: 'bid' | 'ask';
  maxQuantity: number;
  isHighlighted?: boolean;
  isSimulatedOrderPosition?: boolean;
}

const OrderRow: React.FC<OrderRowProps> = ({ 
  entry, 
  side, 
  maxQuantity, 
  isHighlighted = false,
  isSimulatedOrderPosition = false 
}) => {
  const percentage = (entry.quantity / maxQuantity) * 100;
  const isBid = side === 'bid';
  
  return (
    <div 
      className={`
        relative flex justify-between items-center py-1 px-3 text-sm
        ${isHighlighted ? 'bg-yellow-600/20 border-l-4 border-yellow-500' : ''}
        ${isSimulatedOrderPosition ? 'bg-purple-600/20 border-r-4 border-purple-500' : ''}
        hover:bg-gray-700/30 transition-colors
      `}
    >
      {/* Quantity bar background */}
      <div 
        className={`
          absolute inset-0 opacity-20
          ${isBid ? 'bg-buy' : 'bg-sell'}
        `}
        style={{ width: `${percentage}%` }}
      />
      
      <div className="relative z-10 flex justify-between w-full">
        <span className={`font-mono ${isBid ? 'text-buy' : 'text-sell'}`}>
          {entry.price.toFixed(2)}
        </span>
        <span className="text-gray-300">
          {entry.quantity.toFixed(4)}
        </span>
        <span className="text-gray-400">
          {(entry.price * entry.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

const OrderBook: React.FC<OrderBookProps> = ({ 
  orderbook, 
  venue, 
  symbol, 
  simulatedOrder,
  orderPlacement 
}) => {
  const maxQuantity = Math.max(
    ...orderbook.bids.map(b => b.quantity),
    ...orderbook.asks.map(a => a.quantity)
  );

  const spread = OrderSimulationService.calculateSpread(orderbook);
  const imbalance = OrderSimulationService.calculateOrderbookImbalance(orderbook);
  
  const bestBid = orderbook.bids[0]?.price || 0;
  const bestAsk = orderbook.asks[0]?.price || 0;

  const getHighlightedLevels = () => {
    if (!simulatedOrder || !orderPlacement) return { bidHighlights: new Set<number>(), askHighlights: new Set<number>() };
    
    const highlights = { bidHighlights: new Set<number>(), askHighlights: new Set<number>() };
    
    if (simulatedOrder.orderType === 'market') {
      const relevantSide = simulatedOrder.side === 'buy' ? orderbook.asks : orderbook.bids;
      let remainingQuantity = simulatedOrder.quantity;
      
      for (let i = 0; i < relevantSide.length && remainingQuantity > 0; i++) {
        if (simulatedOrder.side === 'buy') {
          highlights.askHighlights.add(i);
        } else {
          highlights.bidHighlights.add(i);
        }
        remainingQuantity -= relevantSide[i].quantity;
      }
    } else if (simulatedOrder.price) {
      // For limit orders, highlight the position where order would sit
      const relevantSide = simulatedOrder.side === 'buy' ? orderbook.bids : orderbook.asks;
      
      for (let i = 0; i < relevantSide.length; i++) {
        const level = relevantSide[i];
        const shouldHighlight = simulatedOrder.side === 'buy' 
          ? level.price <= simulatedOrder.price 
          : level.price >= simulatedOrder.price;
          
        if (shouldHighlight) {
          if (simulatedOrder.side === 'buy') {
            highlights.bidHighlights.add(i);
          } else {
            highlights.askHighlights.add(i);
          }
          break;
        }
      }
    }
    
    return highlights;
  };

  const { bidHighlights, askHighlights } = getHighlightedLevels();

  return (
    <div className="bg-bg-card rounded-lg border border-border-dark overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-border-dark">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{venue}</h3>
          <span className="text-sm text-gray-400">{symbol}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Spread: {spread.toFixed(3)}%</span>
          <span>Imbalance: {imbalance.toFixed(1)}%</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex justify-between px-3 py-2 bg-gray-700 text-xs text-gray-400 font-medium">
        <span>Price</span>
        <span>Quantity</span>
        <span>Total</span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {/* Asks (sells) - displayed in reverse order */}
        <div className="border-b border-border-dark">
          {orderbook.asks.slice().reverse().map((ask, index) => {
            const originalIndex = orderbook.asks.length - 1 - index;
            return (
              <OrderRow
                key={`ask-${originalIndex}`}
                entry={ask}
                side="ask"
                maxQuantity={maxQuantity}
                isHighlighted={askHighlights.has(originalIndex)}
                isSimulatedOrderPosition={
                  simulatedOrder?.side === 'sell' && 
                  simulatedOrder.orderType === 'limit' &&
                  simulatedOrder.price === ask.price
                }
              />
            );
          })}
        </div>

        {/* Spread indicator */}
        <div className="bg-gray-800 px-3 py-2 text-center border-b border-border-dark">
          <div className="text-xs text-gray-400">Spread</div>
          <div className="text-sm font-mono">
            {(bestAsk - bestBid).toFixed(2)} ({spread.toFixed(3)}%)
          </div>
        </div>

        {/* Bids (buys) */}
        <div>
          {orderbook.bids.map((bid, index) => (
            <OrderRow
              key={`bid-${index}`}
              entry={bid}
              side="bid"
              maxQuantity={maxQuantity}
              isHighlighted={bidHighlights.has(index)}
              isSimulatedOrderPosition={
                simulatedOrder?.side === 'buy' && 
                simulatedOrder.orderType === 'limit' &&
                simulatedOrder.price === bid.price
              }
            />
          ))}
        </div>
      </div>

      {/* Footer with last update */}
      <div className="bg-gray-800 px-4 py-2 border-t border-border-dark">
        <div className="text-xs text-gray-400">
          Last update: {new Date(orderbook.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
