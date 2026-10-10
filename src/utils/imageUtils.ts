export const getProductImageUrl = (url: string | undefined | null) => {
    if (!url) return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600";

    // If it's already an absolute URL or a public-relative path
    if (url.startsWith('http') || url.startsWith('/')) return url;

    // Most high-quality and multi-view assets are in s-products
    // Others are in products. We'll try to be smart in the DB by prepending paths,
    // but as a fallback, we'll try s-products.
    return `/s-products/${url}`;
};
