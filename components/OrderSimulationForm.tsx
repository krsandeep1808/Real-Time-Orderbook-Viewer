'use client';

import React, { useState, useEffect } from 'react';
import { SimulatedOrder } from '@/types';

interface OrderSimulationFormProps {
  onOrderSubmit: (order: SimulatedOrder) => void;
  currentVenue: string;
  currentSymbol: string;
  isLoading?: boolean;
}

const OrderSimulationForm: React.FC<OrderSimulationFormProps> = ({
  onOrderSubmit,
  currentVenue,
  currentSymbol,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<SimulatedOrder>({
    venue: currentVenue,
    symbol: currentSymbol,
    orderType: 'market',
    side: 'buy',
    quantity: 0.001,
    timing: 'immediate'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when venue/symbol changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      venue: currentVenue,
      symbol: currentSymbol
    }));
  }, [currentVenue, currentSymbol]);

  const venues = [
    { value: 'okx', label: 'OKX', symbols: ['BTC-USDT', 'ETH-USDT'] },
    { value: 'bybit', label: 'Bybit', symbols: ['BTCUSDT', 'ETHUSDT'] },
    { value: 'deribit', label: 'Deribit', symbols: ['BTC-PERPETUAL', 'ETH-PERPETUAL'] }
  ];

  const getSymbolsForVenue = (venue: string) => {
    const venueConfig = venues.find(v => v.value === venue);
    return venueConfig?.symbols || [];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.venue) {
      newErrors.venue = 'Venue is required';
    }

    if (!formData.symbol) {
      newErrors.symbol = 'Symbol is required';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.orderType === 'limit' && (!formData.price || formData.price <= 0)) {
      newErrors.price = 'Price is required for limit orders and must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onOrderSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof SimulatedOrder, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleVenueChange = (venue: string) => {
    const symbols = getSymbolsForVenue(venue);
    setFormData(prev => ({
      ...prev,
      venue,
      symbol: symbols[0] || ''
    }));
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border-dark p-6">
      <h2 className="text-xl font-semibold mb-6">Order Simulation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Venue Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Venue
          </label>
          <select
            value={formData.venue}
            onChange={(e) => handleVenueChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {venues.map(venue => (
              <option key={venue.value} value={venue.value}>
                {venue.label}
              </option>
            ))}
          </select>
          {errors.venue && (
            <p className="text-red-400 text-xs mt-1">{errors.venue}</p>
          )}
        </div>

        {/* Symbol Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Symbol
          </label>
          <select
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {getSymbolsForVenue(formData.venue).map(symbol => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
          {errors.symbol && (
            <p className="text-red-400 text-xs mt-1">{errors.symbol}</p>
          )}
        </div>

        {/* Order Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Order Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="market"
                checked={formData.orderType === 'market'}
                onChange={(e) => handleInputChange('orderType', e.target.value)}
                className="mr-2 text-blue-500"
                disabled={isLoading}
              />
              <span className="text-gray-300">Market</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="limit"
                checked={formData.orderType === 'limit'}
                onChange={(e) => handleInputChange('orderType', e.target.value)}
                className="mr-2 text-blue-500"
                disabled={isLoading}
              />
              <span className="text-gray-300">Limit</span>
            </label>
          </div>
        </div>

        {/* Side Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Side
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleInputChange('side', 'buy')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                formData.side === 'buy'
                  ? 'bg-buy text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('side', 'sell')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                formData.side === 'sell'
                  ? 'bg-sell text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Price Input (only for limit orders) */}
        {formData.orderType === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter limit price"
              disabled={isLoading}
            />
            {errors.price && (
              <p className="text-red-400 text-xs mt-1">{errors.price}</p>
            )}
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            step="0.0001"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quantity"
            disabled={isLoading}
          />
          {errors.quantity && (
            <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>
          )}
        </div>

        {/* Timing Simulation */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Timing Simulation
          </label>
          <select
            value={formData.timing}
            onChange={(e) => handleInputChange('timing', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="immediate">Immediate</option>
            <option value="5s">5 seconds delay</option>
            <option value="10s">10 seconds delay</option>
            <option value="30s">30 seconds delay</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Simulating...' : 'Simulate Order'}
        </button>
      </form>
    </div>
  );
};

export default OrderSimulationForm;
