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
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: CartItem[];
  shipping_address: string;
  created_at: string;
};
