'use client';

import React from 'react';

interface VenueSelectorProps {
  selectedVenue: string;
  selectedSymbol: string;
  onVenueChange: (venue: string, symbol: string) => void;
}

const VenueSelector: React.FC<VenueSelectorProps> = ({
  selectedVenue,
  selectedSymbol,
  onVenueChange
}) => {
  const venues = [
    { 
      value: 'okx', 
      label: 'OKX', 
      symbols: ['BTC-USDT', 'ETH-USDT'],
      status: 'connected'
    },
    { 
      value: 'bybit', 
      label: 'Bybit', 
      symbols: ['BTCUSDT', 'ETHUSDT'],
      status: 'connected'
    },
    { 
      value: 'deribit', 
      label: 'Deribit', 
      symbols: ['BTC-PERPETUAL', 'ETH-PERPETUAL'],
      status: 'connected'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border-dark p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Venue Selection</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {venues.map(venue => (
          <div key={venue.value} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">{venue.label}</h3>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(venue.status)} mr-2`}></div>
                <span className="text-xs text-gray-400 capitalize">{venue.status}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {venue.symbols.map(symbol => (
                <button
                  key={`${venue.value}-${symbol}`}
                  onClick={() => onVenueChange(venue.value, symbol)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                    ${selectedVenue === venue.value && selectedSymbol === symbol
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueSelector;
