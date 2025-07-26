# 🔌 Custom API Integration Guide

This guide will help you integrate your own API into the Real-Time Orderbook Viewer application.

## 📋 **Quick Setup Steps**

### **Step 1: Configure Environment Variables**

Edit the `.env.local` file with your API details:

```env
# Enable custom API integration
NEXT_PUBLIC_ENABLE_CUSTOM_API=true

# Your API endpoints
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com/ws

# Authentication (if required)
NEXT_PUBLIC_API_KEY=your_api_key_here

# Custom endpoint paths (optional - defaults provided)
NEXT_PUBLIC_ORDERBOOK_ENDPOINT=/orderbook/{symbol}
NEXT_PUBLIC_SYMBOLS_ENDPOINT=/symbols
NEXT_PUBLIC_TICKER_ENDPOINT=/ticker/{symbol}
```

### **Step 2: Test Your API**

```bash
# Run the application
npm run dev

# Check browser console for connection status
# Look for "Custom API connected successfully" or error messages
```

---

## 🛠️ **API Requirements**

### **Required Endpoints**

#### **1. Orderbook Endpoint**
- **URL**: `GET /orderbook/{symbol}`
- **Purpose**: Fetch current orderbook data
- **Response Format**:
```json
{
  "bids": [
    [49950.50, 0.123],  // [price, quantity]
    [49949.00, 0.456]
  ],
  "asks": [
    [50050.50, 0.789],
    [50051.00, 0.234]
  ],
  "timestamp": 1640995200000
}
```

#### **2. Symbols Endpoint (Optional)**
- **URL**: `GET /symbols`
- **Purpose**: Get available trading symbols
- **Response Format**:
```json
["BTC-USDT", "ETH-USDT", "BTC-PERPETUAL"]
```

### **Optional Features**

#### **WebSocket Support**
- **URL**: `wss://your-api-domain.com/ws`
- **Purpose**: Real-time orderbook updates
- **Subscription Message**:
```json
{
  "action": "subscribe",
  "channel": "orderbook",
  "symbol": "BTC-USDT",
  "venue": "your_venue"
}
```

---

## 🔧 **Customization Options**

### **Different API Response Formats**

The application can handle various response formats. Update the normalization methods in `services/customApiService.ts`:

#### **Array Format**
```json
{
  "bids": [[price, quantity], [price, quantity]],
  "asks": [[price, quantity], [price, quantity]]
}
```

#### **Object Format**
```json
{
  "bids": [{"price": 50000, "quantity": 0.1, "size": 0.1}],
  "asks": [{"price": 50100, "size": 0.2, "amount": 0.2}]
}
```

#### **Nested Format**
```json
{
  "data": {
    "bid": [{"p": 50000, "q": 0.1}],
    "ask": [{"p": 50100, "q": 0.2}]
  }
}
```

### **Authentication Methods**

#### **Bearer Token**
```typescript
headers: {
  'Authorization': `Bearer ${apiKey}`
}
```

#### **API Key Header**
```typescript
headers: {
  'X-API-Key': apiKey
}
```

#### **Custom Headers**
```typescript
headers: {
  'Custom-Auth': apiKey,
  'Client-ID': 'your-client-id'
}
```

---

## 📝 **Example API Implementations**

### **Express.js Example**

```javascript
// Basic orderbook endpoint
app.get('/api/v1/orderbook/:symbol', (req, res) => {
  const { symbol } = req.params;
  
  // Your logic to fetch orderbook data
  const orderbook = {
    bids: [
      [49950.50, 0.123],
      [49949.00, 0.456]
    ],
    asks: [
      [50050.50, 0.789],
      [50051.00, 0.234]
    ],
    timestamp: Date.now()
  };
  
  res.json(orderbook);
});

// CORS headers for browser access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  next();
});
```

### **Python Flask Example**

```python
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

@app.route('/api/v1/orderbook/<symbol>')
def get_orderbook(symbol):
    # Your logic here
    orderbook = {
        'bids': [[49950.50, 0.123], [49949.00, 0.456]],
        'asks': [[50050.50, 0.789], [50051.00, 0.234]],
        'timestamp': int(time.time() * 1000)
    }
    return jsonify(orderbook)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

## 🧪 **Testing Your Integration**

### **Step 1: Test REST API**
```bash
# Test your orderbook endpoint
curl "https://your-api-domain.com/api/v1/orderbook/BTC-USDT"

# Expected response
{
  "bids": [[49950, 0.123]],
  "asks": [[50050, 0.789]],
  "timestamp": 1640995200000
}
```

### **Step 2: Check Browser Console**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for these messages:
   - ✅ "Custom API connected successfully"
   - ✅ "Connected to custom WebSocket for..."
   - ❌ "API connection test failed"
   - ❌ "Failed to fetch orderbook"

### **Step 3: Verify Data Display**
- Check if orderbook shows your real data
- Verify prices and quantities are correct
- Test venue/symbol switching

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **CORS Errors**
```
Access to fetch at 'your-api' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution**: Add CORS headers to your API:
```javascript
res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
```

#### **Authentication Errors**
```
API Error: 401 Unauthorized
```
**Solution**: Check your API key in `.env.local`:
```env
NEXT_PUBLIC_API_KEY=your_correct_api_key
```

#### **Data Format Issues**
```
Error normalizing orderbook data
```
**Solution**: Update the `normalizeOrderbookData` method in `customApiService.ts` to match your API format.

#### **WebSocket Connection Failed**
```
WebSocket connection failed
```
**Solution**: 
1. Check WebSocket URL in `.env.local`
2. Verify WebSocket server is running
3. Check subscription message format

---

## 🔄 **Real-Time Updates**

### **WebSocket Integration**

If your API supports WebSockets, update the subscription message format:

```typescript
// In customApiService.ts, update the subscription message
const subscriptionMessage = {
  // Customize based on your WebSocket API
  type: 'subscribe',
  topic: 'depth',
  symbol: symbol,
  // Add any additional fields your API requires
};
```

### **REST API Polling**

If WebSocket isn't available, the app will poll your REST API. You can adjust the polling interval:

```typescript
// Add polling interval to the service
setInterval(() => {
  fetchCustomOrderbook(selectedSymbol, selectedVenue, customApi);
}, 5000); // Poll every 5 seconds
```

---

## 📊 **Data Flow Diagram**

```
Your API → CustomApiService → Application State → UI Components
    ↓
[REST/WebSocket] → [Normalize Data] → [Update OrderBook] → [Display]
```

---

## 🎯 **Next Steps**

1. **Configure your `.env.local` file**
2. **Test your API endpoints**
3. **Run the application with `npm run dev`**
4. **Check browser console for connection status**
5. **Verify orderbook data displays correctly**

---

## 💡 **Additional Features**

### **Rate Limiting**
```typescript
// Add rate limiting configuration
const customApi = new CustomApiService({
  baseUrl: 'your-api-url',
  rateLimit: {
    requests: 100,
    window: 60000 // 1 minute
  }
});
```

### **Error Handling**
```typescript
// Custom error handling
customApi.onError((error) => {
  console.error('API Error:', error);
  // Your custom error handling logic
});
```

### **Caching**
```typescript
// Add response caching
const customApi = new CustomApiService({
  baseUrl: 'your-api-url',
  cache: {
    enabled: true,
    ttl: 5000 // 5 seconds
  }
});
```

---

**Need help? Check the browser console for detailed error messages and refer to this guide for solutions!**
