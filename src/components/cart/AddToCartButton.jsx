// AddToCartButton.jsx
// Standalone kosárba gomb - NEM függ CartContext-től
// Mentsd ide: src/components/cart/AddToCartButton.jsx

import { useState, useEffect } from 'react';

// Shopify konfiguráció
const SHOPIFY_DOMAIN = 'zephyr-hangover.myshopify.com';
const STOREFRONT_ACCESS_TOKEN = 'a225ffacab411d067a8d8b474e490668';
const PRODUCT_HANDLE = 'teszt-zephyr-termek';

// GraphQL query
const PRODUCT_QUERY = `
  query getProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      variants(first: 10) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

async function shopifyFetch(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// Helper: get cart from localStorage
function getCart() {
  try {
    const saved = localStorage.getItem('zephyr-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Helper: save cart to localStorage
function saveCart(items) {
  localStorage.setItem('zephyr-cart', JSON.stringify(items));
  // Notify other components
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

// Helper: add item to cart
function addToCart(variant, quantity = 1) {
  const items = getCart();
  const existing = items.find(item => item.variantId === variant.id);
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      variantId: variant.id,
      title: variant.title,
      price: parseFloat(variant.price.amount),
      quantity: quantity,
    });
  }
  
  saveCart(items);
  
  // Open cart drawer
  window.dispatchEvent(new CustomEvent('openCart'));
}

export default function AddToCartButton({ variantIndex = 0 }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(variantIndex);

  // Listen for variant changes from parent
  useEffect(() => {
    const handleVariantChange = (e) => {
      setSelectedIndex(e.detail.index);
    };
    
    window.addEventListener('variantChange', handleVariantChange);
    return () => window.removeEventListener('variantChange', handleVariantChange);
  }, []);

  // Load product
  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await shopifyFetch(PRODUCT_QUERY, { handle: PRODUCT_HANDLE });
        setProduct(data.product);
        console.log('Product loaded:', data.product?.title);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, []);

  // Handle add to cart
  async function handleAddToCart() {
    if (!product) return;
    
    const variant = product.variants.edges[selectedIndex]?.node;
    if (!variant) {
      console.error('Variant not found at index:', selectedIndex);
      return;
    }

    setAdding(true);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addToCart(variant, 1);
    setAdding(false);
  }

  // Get current variant info
  const variant = product?.variants.edges[selectedIndex]?.node;
  const price = variant ? parseFloat(variant.price.amount).toLocaleString('hu-HU') : '...';

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || adding || !product}
      className="w-full py-4 px-8 bg-[#6D2077] text-white font-semibold text-lg rounded-full hover:bg-[#4A1552] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Betöltés...
        </span>
      ) : adding ? (
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Hozzáadás...
        </span>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Kosárba — {price} Ft
        </>
      )}
    </button>
  );
}
