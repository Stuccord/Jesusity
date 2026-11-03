import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type Product } from "../data/products";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  colorway?: string | undefined;
  price: number;
  image: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  cartBump: boolean;
  /** false until the saved bag has been read from this device */
  isCartReady: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (
    product:
      | Product
      | {
          id: string;
          slug: string;
          name: string;
          colorway?: string | undefined;
          price: number;
          image: string;
        },
    size: string,
    quantity?: number,
  ) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "supernatural_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  // The saved bag is read after mount so the server and first client render match
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // ignore unreadable storage
    }
    setHasLoaded(true);
  }, []);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage write errors
    }
  }, [items, hasLoaded]);

  const triggerBump = useCallback(() => {
    setCartBump(true);
    setTimeout(() => setCartBump(false), 350);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addToCart = useCallback(
    (
      product:
        | Product
        | {
            id: string;
            slug: string;
            name: string;
            colorway?: string | undefined;
            price: number;
            image?: string | undefined;
            images?: { front: string } | undefined;
          },
      size: string,
      quantity = 1,
    ) => {
      const imageSrc =
        ("images" in product && product.images?.front) ||
        ("image" in product && typeof product.image === "string" ? product.image : "") ||
        "";

      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.id === product.id && item.size === size,
        );

        if (existingIndex > -1) {
          const updated = [...prev];
          const existing = updated[existingIndex];
          if (existing) {
            updated[existingIndex] = {
              ...existing,
              quantity: existing.quantity + quantity,
            };
          }
          return updated;
        }

        const newItem: CartItem = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          colorway: product.colorway,
          price: product.price,
          image: imageSrc,
          size,
          quantity,
        };

        return [...prev, newItem];
      });

      triggerBump();
      setIsCartOpen(true);

      // Dispatch global window event for compatibility
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cart-item-added", { detail: { product, size, quantity } }),
        );
      }
    },
    [triggerBump],
  );

  const removeFromCart = useCallback((id: string, size: string) => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  }, []);

  const updateQuantity = useCallback((id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id && item.size === size ? { ...item, quantity } : item)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      // Also clear storage now, in case the saved bag hasn't been loaded yet
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  // Listen for legacy or external cart-item-added events
  useEffect(() => {
    const handleLegacyAdd = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail) {
        triggerBump();
      }
    };
    window.addEventListener("cart-item-added", handleLegacyAdd);
    return () => window.removeEventListener("cart-item-added", handleLegacyAdd);
  }, [triggerBump]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartReady: hasLoaded,
        cartCount,
        cartSubtotal,
        isCartOpen,
        cartBump,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
