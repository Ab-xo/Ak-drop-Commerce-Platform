export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  short_description?: string | null;
  price: number;
  compare_price?: number | null;
  category_id: string;
  category?: Category;
  stock: number;
  quantity?: number;
  main_image: string;
  images: string[];
  features?: string[];
  tags?: string[];
  attributes?: Record<string, unknown>;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_active?: boolean;
  created_at: string;
};

export type CartItem = Product & { quantity: number };

export type Order = {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  subtotal_amount: number;
  delivery_fee_amount: number | null;
  total_is_final: boolean;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_address: Record<string, unknown> | null;
  created_at: string;
};

export type OrderSummary = Pick<
  Order,
  | 'id'
  | 'order_number'
  | 'status'
  | 'total_amount'
  | 'subtotal_amount'
  | 'delivery_fee_amount'
  | 'total_is_final'
  | 'currency'
  | 'payment_method'
  | 'payment_status'
  | 'created_at'
>;

export type UserNotification = {
  id: string;
  order_id: string | null;
  type: 'order' | 'promo' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};
