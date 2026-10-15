'use client';

import { motion } from 'framer-motion';
import { Package, Calendar, Truck, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { OrderSummary } from '@/types';
import { formatDisplayCurrency } from '@/lib/currency';

interface OrdersSectionProps {
  orders: OrderSummary[];
}

export default function OrdersSection({ orders }: OrdersSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-500 bg-green-500/10';
      case 'shipped':
        return 'text-blue-500 bg-blue-500/10';
      case 'processing':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle size={16} />;
      case 'shipped':
        return <Truck size={16} />;
      case 'processing':
        return <Clock size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-secondary/20 rounded-xl border border-border">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package size={40} className="text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
        <p className="text-muted-foreground mb-6 text-sm">Start shopping to see your orders here</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-medium shadow-lg shadow-primary/25"
        >
          <Package size={18} />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Order History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage all your orders
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-secondary/20 border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Order Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                  <Package size={20} className="text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-foreground">
                      Order #{order.order_number}
                    </h3>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} />
                      <span>{new Date(order.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package size={13} />
                      <span className="font-semibold text-foreground">
                        {order.total_is_final
                          ? formatDisplayCurrency(order.total_amount, 'USD')
                          : `Subtotal ${formatDisplayCurrency(order.subtotal_amount, 'USD')}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        order.payment_method === 'cash_on_delivery'
                          ? 'bg-blue-500/10 text-blue-500'
                          : order.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-500'
                          : order.payment_status === 'paid'
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {order.payment_method === 'stripe'
                          ? order.payment_status === 'paid'
                            ? 'Stripe · paid'
                            : order.status === 'cancelled'
                              ? 'Stripe · cancelled'
                              : 'Stripe · payment pending'
                          : order.payment_method === 'cash_on_delivery'
                            ? 'Demo · COD flow'
                            : order.payment_status === 'paid'
                              ? 'Paid'
                              : 'Payment pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-sm whitespace-nowrap group-hover:gap-3 shadow-lg shadow-primary/25"
              >
                View Details
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-5 bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 rounded-xl">
        <h3 className="font-semibold text-foreground mb-2 text-sm">
          Need help with an order?
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Our support team is here to assist you with any questions or concerns.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-xs"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
