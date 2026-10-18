import type { Product, ProductVariant } from '@/types';

export function getVariantPrice(productPrice: number, variant: ProductVariant) {
  return variant.price_override ?? productPrice + variant.price_adjustment;
}

export function getVariantLabel(variant: ProductVariant) {
  const options = [
    variant.size ? `Size ${variant.size}` : null,
    variant.color,
    ...Object.entries(variant.attributes).map(([name, value]) => `${name}: ${value}`),
  ].filter((value): value is string => Boolean(value));

  return options.length ? options.join(' · ') : variant.sku || 'Standard option';
}

export function getCartLineId(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? 'default'}`;
}

export function getAvailableProductStock(product: Product) {
  if (product.variants?.length) {
    return product.variants.reduce((total, variant) => total + variant.stock_quantity, 0);
  }

  return product.track_quantity === false ? 999 : product.stock;
}
