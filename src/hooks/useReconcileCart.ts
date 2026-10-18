import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { getProductsByIds } from '@/utils/supabaseFetch';

export function useReconcileCart() {
  const items = useCartStore((state) => state.items);
  const reconcileProducts = useCartStore((state) => state.reconcileProducts);
  const [result, setResult] = useState<{ productKey: string; status: 'ready' | 'error' }>({
    productKey: '',
    status: 'ready',
  });
  const productIds = [...new Set(items.map((item) => item.id))].sort();
  const productKey = productIds.join(',');

  useEffect(() => {
    if (!productKey) return;

    let cancelled = false;
    getProductsByIds(productKey.split(','))
      .then((products) => {
        if (cancelled) return;
        reconcileProducts(products);
        setResult({ productKey, status: 'ready' });
      })
      .catch((error: unknown) => {
        console.error('Unable to reconcile the persisted cart:', error);
        if (!cancelled) setResult({ productKey, status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [productKey, reconcileProducts]);

  if (!productKey) return 'ready';
  return result.productKey === productKey ? result.status : 'refreshing';
}
