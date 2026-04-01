// CartIconStandalone.jsx
// Önálló kosár ikon ami közvetlenül localStorage-ból olvas
// Mentsd ide: src/components/cart/CartIconStandalone.jsx

import { useState, useEffect } from 'react';

export default function CartIconStandalone() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    // Load initial count
    function updateCount() {
      try {
        const saved = localStorage.getItem('zephyr-cart');
        if (saved) {
          const items = JSON.parse(saved);
          const count = items.reduce((sum, item) => sum + item.quantity, 0);
          setItemCount(count);
        } else {
          setItemCount(0);
        }
      } catch (e) {
        setItemCount(0);
      }
    }

    updateCount();

    // Listen for storage changes (from other components)
    window.addEventListener('storage', updateCount);
    
    // Listen for custom cart update events
    window.addEventListener('cartUpdated', updateCount);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cartUpdated', updateCount);
    };
  }, []);

  function openCart() {
    // Dispatch event to open cart drawer
    window.dispatchEvent(new CustomEvent('openCart'));
  }

  return (
    <button
      onClick={openCart}
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      aria-label={`Kosár (${itemCount} termék)`}
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      
      {/* Badge */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#6D2077] text-white text-xs font-bold rounded-full flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
