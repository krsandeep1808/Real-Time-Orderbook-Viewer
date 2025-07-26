'use client';

import React from 'react';
import { SimulatedOrder, OrderPlacement } from '@/types';

interface OrderPlacementVisualizationProps {
  simulatedOrder: SimulatedOrder;
  orderPlacement: OrderPlacement;
}

const OrderPlacementVisualization: React.FC<OrderPlacementVisualizationProps> = ({
  simulatedOrder,
  orderPlacement
}) => {
  const getSlippageColor = (slippage: number) => {
    if (slippage < 0.1) return 'text-green-400';
    if (slippage < 0.5) return 'text-yellow-400';
    if (slippage < 1.0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getImpactColor = (impact: number) => {
    if (impact < 5) return 'text-green-400';
    if (impact < 15) return 'text-yellow-400';
    if (impact < 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Immediate';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  const getOrderTypeDisplay = () => {
    return `${simulatedOrder.orderType.toUpperCase()} ${simulatedOrder.side.toUpperCase()}`;
  };

  const shouldShowWarning = () => {
    return orderPlacement.slippage > 1.0 || orderPlacement.marketImpact > 20;
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border-dark p-6">
      <h2 className="text-xl font-semibold mb-6">Order Impact Analysis</h2>
      
      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Order Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Type:</span>
            <span className={`ml-2 font-medium ${
              simulatedOrder.side === 'buy' ? 'text-buy' : 'text-sell'
            }`}>
              {getOrderTypeDisplay()}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Venue:</span>
            <span className="ml-2 font-medium text-white">
              {simulatedOrder.venue.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Symbol:</span>
            <span className="ml-2 font-medium text-white">
              {simulatedOrder.symbol}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Quantity:</span>
            <span className="ml-2 font-medium text-white">
              {simulatedOrder.quantity}
            </span>
          </div>
          {simulatedOrder.price && (
            <div>
              <span className="text-gray-400">Price:</span>
              <span className="ml-2 font-medium text-white">
                ${simulatedOrder.price.toFixed(2)}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-400">Timing:</span>
            <span className="ml-2 font-medium text-white">
              {simulatedOrder.timing}
            </span>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {shouldShowWarning() && (
        <div className="mb-6 p-4 bg-red-600/20 border border-red-500 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">⚠️</div>
            <div>
              <h4 className="font-medium text-red-400">Significant Market Impact Warning</h4>
              <p className="text-sm text-red-300 mt-1">
                This order may cause significant slippage or market impact. Consider breaking it into smaller orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Fill Percentage */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-2">Estimated Fill</h4>
          <div className="text-2xl font-bold text-white">
            {orderPlacement.fillPercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {orderPlacement.fillPercentage === 100 ? 'Complete fill expected' : 'Partial fill expected'}
          </div>
        </div>

        {/* Market Impact */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-2">Market Impact</h4>
          <div className={`text-2xl font-bold ${getImpactColor(orderPlacement.marketImpact)}`}>
            {orderPlacement.marketImpact.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Impact on market depth
          </div>
        </div>

        {/* Slippage */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-2">Slippage</h4>
          <div className={`text-2xl font-bold ${getSlippageColor(orderPlacement.slippage)}`}>
            {orderPlacement.slippage.toFixed(3)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Price deviation expected
          </div>
        </div>

        {/* Time to Fill */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm text-gray-400 mb-2">Time to Fill</h4>
          <div className="text-2xl font-bold text-white">
            {formatTime(orderPlacement.timeToFill || 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Estimated execution time
          </div>
        </div>
      </div>

      {/* Position in Orderbook */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h4 className="text-lg font-medium mb-3">Orderbook Position</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
            <span className="text-gray-300">
              Position #{orderPlacement.position} in queue
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {simulatedOrder.orderType === 'market' 
              ? 'Consuming liquidity across multiple levels'
              : `Waiting in ${simulatedOrder.side} queue`
            }
          </div>
        </div>
      </div>

      {/* Execution Strategy Recommendations */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="text-lg font-medium mb-3">Execution Recommendations</h4>
        <div className="space-y-2 text-sm">
          {orderPlacement.slippage > 0.5 && (
            <div className="flex items-start">
              <div className="text-yellow-400 mr-2 mt-0.5">•</div>
              <span className="text-gray-300">
                Consider splitting this order into smaller chunks to reduce slippage
              </span>
            </div>
          )}
          
          {orderPlacement.marketImpact > 15 && (
            <div className="flex items-start">
              <div className="text-orange-400 mr-2 mt-0.5">•</div>
              <span className="text-gray-300">
                High market impact detected - consider using a TWAP strategy
              </span>
            </div>
          )}
          
          {simulatedOrder.orderType === 'limit' && orderPlacement.position > 5 && (
            <div className="flex items-start">
              <div className="text-blue-400 mr-2 mt-0.5">•</div>
              <span className="text-gray-300">
                Order is deep in queue - consider adjusting price for faster execution
              </span>
            </div>
          )}
          
          {orderPlacement.fillPercentage < 100 && (
            <div className="flex items-start">
              <div className="text-red-400 mr-2 mt-0.5">•</div>
              <span className="text-gray-300">
                Insufficient liquidity for complete fill - only {orderPlacement.fillPercentage.toFixed(1)}% expected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPlacementVisualization;
