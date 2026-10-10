export type Category = {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    description?: string;
};

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    stock: number;
    main_image: string;
    images: string[];
    features?: string[];
    is_featured?: boolean;
    is_new_arrival?: boolean;
    created_at: string;
};

export type CartItem = Product & {
    quantity: number;
};

export type Order = {
    id: string;
    user_id: string;
    total_amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    items: CartItem[];
    shipping_address: string;
    created_at: string;
};
