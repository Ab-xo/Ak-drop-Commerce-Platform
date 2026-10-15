'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function ClearCartOnPaidOrder() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
    try {
      sessionStorage.removeItem('ak-drop-checkout-idempotency-key');
      sessionStorage.removeItem('ak-drop-checkout-request-fingerprint');
    } catch (error) {
      console.error('Unable to clear the saved checkout retry token:', error);
    }
  }, [clearCart]);

  return null;
}
