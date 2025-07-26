# Real-Time Orderbook Viewer with Order Simulation

A comprehensive Next.js application that displays real-time orderbook data from multiple cryptocurrency exchanges and provides advanced order simulation capabilities to help traders understand market impact and optimal timing.

## 🚀 Features

### Multi-Venue Orderbook Display
- **Real-time data integration** from OKX, Bybit, and Deribit exchanges
- **Live orderbook visualization** with 15 levels of bids and asks
- **Visual depth representation** with quantity bars
- **Spread and imbalance indicators** for market analysis
- **Seamless venue switching** between exchanges

### Advanced Order Simulation
- **Complete order form** with venue, symbol, order type, side, price, quantity, and timing controls
- **Market and limit order support** with accurate positioning
- **Real-time order placement visualization** in the orderbook
- **Comprehensive impact analysis** including slippage, market impact, and execution time
- **Visual indicators** highlighting affected orderbook levels

### Order Impact Analysis
- **Fill percentage estimation** for order completion likelihood
- **Market impact calculation** based on order size relative to available liquidity
- **Slippage analysis** with color-coded warnings
- **Time-to-fill estimation** considering queue position and timing delays
- **Execution recommendations** for optimal order placement strategies

### Responsive Design
- **Mobile-first approach** ensuring usability across all device sizes
- **Adaptive layouts** optimized for both desktop and mobile trading
- **Intuitive navigation** between different views and functionalities
- **Dark theme** optimized for trading environments

## 🛠️ Technical Implementation

### Architecture
- **Next.js 14** with App Router for modern React development
- **TypeScript** for type safety and better development experience
- **Tailwind CSS** for responsive and maintainable styling
- **WebSocket integration** for real-time data streaming
- **Modular service architecture** for data management and business logic

### Real-Time Data Integration
- **WebSocket connections** to exchange APIs with automatic reconnection
- **Error handling and fallback mechanisms** for API failures and rate limiting
- **Data normalization** across different exchange formats
- **Connection status monitoring** with visual indicators

### State Management
- **React hooks** for efficient state management
- **Real-time data updates** with optimized re-rendering
- **Form state validation** with comprehensive error handling
- **WebSocket connection cleanup** to prevent memory leaks

### Order Simulation Engine
- **Market order simulation** consuming liquidity across multiple levels
- **Limit order positioning** with queue depth analysis
- **Dynamic impact calculations** based on current market conditions
- **Timing simulation** with configurable delay scenarios

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Modern web browser with WebSocket support

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/orderbook-viewer.git
   cd orderbook-viewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## 🎯 Usage Guide

### Getting Started
1. **Select a venue and symbol** from the venue selector at the top
2. **View real-time orderbook data** with live price and quantity updates
3. **Use the order simulation form** to configure your hypothetical order
4. **Submit the simulation** to see impact analysis and placement visualization

### Order Simulation Workflow
1. **Choose venue and symbol** (automatically synced with orderbook display)
2. **Select order type** (Market or Limit)
3. **Choose side** (Buy or Sell)
4. **Enter quantity** and price (for limit orders)
5. **Set timing simulation** (Immediate, 5s, 10s, or 30s delay)
6. **Submit for analysis** to see detailed impact metrics

### Understanding the Results
- **Yellow highlighting** shows orderbook levels affected by your order
- **Purple indicators** mark where limit orders would be positioned
- **Impact metrics** provide quantitative analysis of market effects
- **Execution recommendations** suggest optimization strategies

## 🏗️ Project Structure

```
orderbook-viewer/
├── app/                          # Next.js App Router pages
│   ├── globals.css              # Global styles with Tailwind
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Main application page
├── components/                   # React components
│   ├── OrderBook.tsx            # Orderbook display component
│   ├── OrderSimulationForm.tsx  # Order form component
│   ├── OrderPlacementVisualization.tsx # Impact analysis display
│   └── VenueSelector.tsx        # Venue switching component
├── services/                     # Business logic services
│   ├── websocketService.ts      # WebSocket connection management
│   └── orderSimulationService.ts # Order simulation engine
├── types/                        # TypeScript type definitions
│   └── index.ts                 # Shared interfaces and types
├── package.json                 # Project dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

## 🔌 API Integration

### Supported Exchanges
- **OKX**: WebSocket endpoint `wss://ws.okx.com:8443/ws/v5/public`
- **Bybit**: WebSocket endpoint `wss://stream.bybit.com/v5/public/spot`
- **Deribit**: WebSocket endpoint `wss://www.deribit.com/ws/api/v2`

### Data Format Normalization
The application normalizes data from different exchanges into a consistent format:
```typescript
interface OrderBook {
  bids: OrderBookEntry[];  // Sorted by price descending
  asks: OrderBookEntry[];  // Sorted by price ascending
  timestamp: number;       // Last update timestamp
}
```

### Rate Limiting Considerations
- **Connection throttling** to respect exchange limits
- **Exponential backoff** for reconnection attempts
- **Graceful degradation** when API limits are reached

## 🧪 Testing & Quality Assurance

### Manual Testing Checklist
- [ ] Venue switching functionality
- [ ] Real-time data updates
- [ ] Order simulation accuracy
- [ ] Responsive design on mobile devices
- [ ] WebSocket reconnection handling
- [ ] Form validation and error handling

### Performance Optimization
- **Optimized re-rendering** using React.memo and useCallback
- **Efficient data structures** for orderbook management
- **Debounced updates** to prevent excessive re-renders
- **Memory leak prevention** with proper cleanup

## 🚨 Known Limitations

1. **Demo Mode**: The application includes mock data for demonstration when WebSocket connections fail
2. **Rate Limiting**: Real exchange connections may be subject to rate limits
3. **Market Hours**: Some exchanges may have limited data availability during certain hours
4. **Browser Compatibility**: Requires modern browsers with WebSocket support

## 🔮 Future Enhancements

### Planned Features
- [ ] **Market depth visualization** with cumulative volume charts
- [ ] **Historical orderbook replay** for backtesting scenarios
- [ ] **Advanced order types** (Stop-loss, Take-profit, Iceberg)
- [ ] **Multi-venue arbitrage detection** and analysis
- [ ] **Export functionality** for simulation results
- [ ] **User preferences** and saved simulation templates

### Technical Improvements
- [ ] **Server-side rendering** for better SEO and performance
- [ ] **Progressive Web App** features for mobile installation
- [ ] **Real-time notifications** for significant market movements
- [ ] **Enhanced error handling** with retry mechanisms
- [ ] **Performance monitoring** and analytics integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- Exchange APIs provided by OKX, Bybit, and Deribit
- UI components inspired by professional trading platforms
- Community feedback and testing contributions

---

**Built with ❤️ for the trading community**
