// CartIcon.jsx
// Kosár ikon a headerbe, badge-dzsel
// Mentsd ide: src/components/cart/CartIcon.jsx

import { useCart } from './CartContext';

export default function CartIcon() {
  const { setIsOpen, getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <button
      onClick={() => setIsOpen(true)}
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
