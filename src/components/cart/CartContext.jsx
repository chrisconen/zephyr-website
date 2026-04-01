// CartContext.jsx
// Globális kosár state management
// Mentsd ide: src/components/cart/CartContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// Shopify konfiguráció
const SHOPIFY_DOMAIN = 'zephyr-hangover.myshopify.com';
const STOREFRONT_ACCESS_TOKEN = 'a225ffacab411d067a8d8b474e490668';

// Cart létrehozása mutation
const CREATE_CART_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        code
        field
        message
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

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zephyr-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('zephyr-cart', JSON.stringify(items));
    // Dispatch event for standalone components
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }, [items]);

  // Add item to cart
  function addItem(variant, quantity = 1) {
    setItems(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      
      if (existing) {
        // Increase quantity
        return prev.map(item =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        return [...prev, {
          variantId: variant.id,
          title: variant.title,
          price: parseFloat(variant.price.amount),
          quantity: quantity,
        }];
      }
    });
    
    // Open drawer when adding
    setIsOpen(true);
  }

  // Update item quantity
  function updateQuantity(variantId, quantity) {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    
    setItems(prev =>
      prev.map(item =>
        item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  }

  // Remove item
  function removeItem(variantId) {
    setItems(prev => prev.filter(item => item.variantId !== variantId));
  }

  // Clear cart
  function clearCart() {
    setItems([]);
  }

  // Get total items count
  function getItemCount() {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Get total price
  function getTotalPrice() {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // Checkout - create Shopify cart and redirect
  async function checkout() {
    if (items.length === 0) return;
    
    setIsCheckingOut(true);
    
    try {
      const lines = items.map(item => ({
        merchandiseId: item.variantId,
        quantity: item.quantity,
      }));

      const data = await shopifyFetch(CREATE_CART_MUTATION, {
        input: { lines },
      });

      if (data.cartCreate.userErrors?.length > 0) {
        throw new Error(data.cartCreate.userErrors[0].message);
      }

      if (data.cartCreate.cart?.checkoutUrl) {
        // Clear local cart after successful checkout creation
        clearCart();
        window.location.href = data.cartCreate.cart.checkoutUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Hiba történt a fizetés során. Kérjük próbáld újra.');
      setIsCheckingOut(false);
    }
  }

  const value = {
    items,
    isOpen,
    setIsOpen,
    isCheckingOut,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getTotalPrice,
    checkout,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
