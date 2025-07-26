import { OrderBook, OrderBookEntry, SimulatedOrder, OrderPlacement } from '@/types';

export class OrderSimulationService {
  static simulateOrderPlacement(order: SimulatedOrder, orderbook: OrderBook): OrderPlacement {
    const { side, orderType, quantity, price } = order;
    const relevantSide = side === 'buy' ? orderbook.asks : orderbook.bids;
    
    if (orderType === 'market') {
      return this.simulateMarketOrder(order, relevantSide);
    } else {
      return this.simulateLimitOrder(order, orderbook);
    }
  }

  private static simulateMarketOrder(order: SimulatedOrder, marketSide: OrderBookEntry[]): OrderPlacement {
    let remainingQuantity = order.quantity;
    let totalCost = 0;
    let position = 0;
    let slippage = 0;

    for (let i = 0; i < marketSide.length && remainingQuantity > 0; i++) {
      const level = marketSide[i];
      const fillQuantity = Math.min(remainingQuantity, level.quantity);
      
      totalCost += fillQuantity * level.price;
      remainingQuantity -= fillQuantity;
      position = i + 1;
    }

    const avgPrice = totalCost / (order.quantity - remainingQuantity);
    const bestPrice = marketSide[0]?.price || 0;
    slippage = Math.abs((avgPrice - bestPrice) / bestPrice) * 100;

    const fillPercentage = ((order.quantity - remainingQuantity) / order.quantity) * 100;
    const marketImpact = this.calculateMarketImpact(order, marketSide);

    return {
      position,
      fillPercentage,
      marketImpact,
      slippage,
      timeToFill: this.estimateTimeToFill(order.timing)
    };
  }

  private static simulateLimitOrder(order: SimulatedOrder, orderbook: OrderBook): OrderPlacement {
    const { side, price, quantity } = order;
    
    if (!price) {
      throw new Error('Price is required for limit orders');
    }

    const relevantSide = side === 'buy' ? orderbook.bids : orderbook.asks;
    const oppositeSide = side === 'buy' ? orderbook.asks : orderbook.bids;
    
    // Check if order would execute immediately
    const bestOppositePrice = oppositeSide[0]?.price;
    const wouldExecuteImmediately = side === 'buy' 
      ? price >= bestOppositePrice 
      : price <= bestOppositePrice;

    if (wouldExecuteImmediately) {
      // Treat as market order for immediate execution
      return this.simulateMarketOrder({ ...order, orderType: 'market' }, oppositeSide);
    }

    // Find position in the orderbook
    let position = 1;
    let cumulativeQuantity = 0;

    for (let i = 0; i < relevantSide.length; i++) {
      const level = relevantSide[i];
      const betterPrice = side === 'buy' 
        ? level.price > price 
        : level.price < price;

      if (betterPrice) {
        cumulativeQuantity += level.quantity;
        position = i + 2;
      } else {
        break;
      }
    }

    const marketImpact = this.calculateMarketImpact(order, oppositeSide);
    const slippage = 0; // No slippage for limit orders that don't execute immediately
    
    return {
      position,
      fillPercentage: 0, // Won't fill immediately
      marketImpact,
      slippage,
      timeToFill: this.estimateTimeToFill(order.timing, cumulativeQuantity)
    };
  }

  private static calculateMarketImpact(order: SimulatedOrder, marketSide: OrderBookEntry[]): number {
    if (marketSide.length === 0) return 0;

    const totalMarketQuantity = marketSide.reduce((sum, level) => sum + level.quantity, 0);
    const orderRatio = order.quantity / totalMarketQuantity;
    
    // Simple market impact calculation based on order size relative to market depth
    return Math.min(orderRatio * 100, 50); // Cap at 50%
  }

  private static estimateTimeToFill(timing: string, queuePosition?: number): number {
    const baseTime = {
      'immediate': 0,
      '5s': 5,
      '10s': 10,
      '30s': 30
    }[timing] || 0;

    // Add additional time based on queue position for limit orders
    const queueDelay = queuePosition ? Math.log(queuePosition + 1) * 2 : 0;
    
    return baseTime + queueDelay;
  }

  static calculateOrderbookImbalance(orderbook: OrderBook): number {
    const totalBidVolume = orderbook.bids.reduce((sum, bid) => sum + bid.quantity, 0);
    const totalAskVolume = orderbook.asks.reduce((sum, ask) => sum + ask.quantity, 0);
    const totalVolume = totalBidVolume + totalAskVolume;
    
    if (totalVolume === 0) return 0;
    
    return ((totalBidVolume - totalAskVolume) / totalVolume) * 100;
  }

  static detectSignificantSlippage(order: SimulatedOrder, orderbook: OrderBook): boolean {
    const placement = this.simulateOrderPlacement(order, orderbook);
    return placement.slippage > 1.0; // More than 1% slippage is considered significant
  }

  static calculateSpread(orderbook: OrderBook): number {
    if (orderbook.bids.length === 0 || orderbook.asks.length === 0) return 0;
    
    const bestBid = orderbook.bids[0].price;
    const bestAsk = orderbook.asks[0].price;
    
    return ((bestAsk - bestBid) / bestBid) * 100;
  }
}
