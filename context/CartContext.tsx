'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'; // Import useCallback

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: { id: string; name: string; price: number; imageUrl?: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Initialize cart from localStorage on client-side
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = useCallback((product: { id: string; name: string; price: number; images?: { url: string; }[]; }) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.images && product.images.length > 0 ? product.images[0].url : undefined }];
      }
    });
  }, []); // Empty dependency array as it doesn't depend on props or state

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  }, []); // Empty dependency array

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  }, []); // Empty dependency array

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []); // Empty dependency array

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
