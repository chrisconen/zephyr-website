// CartWrapper.jsx
// Wrapper komponens ami összefogja a kosár rendszert
// Mentsd ide: src/components/cart/CartWrapper.jsx

import { CartProvider } from './CartContext';
import CartDrawer from './CartDrawer';

export default function CartWrapper({ children }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
