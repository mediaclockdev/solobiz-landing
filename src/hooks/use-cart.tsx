"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useToast } from "@/contexts/ToastContext";

export interface CartItem {
  selectedCard: any;
  id: string;
  type: "nfc-card" | "tap-sticker" | "accessory";
  name: string;
  quantity: number;
  orderItemId?:any;
  unitPrice: number;
  originalPrice?: number;
  options?: {
    customLogo?: boolean;
    keychain?: boolean;
    nfcEnabled?: boolean;
    engraving?: string;
  };
  image?: string;
  color?: string;
  assignedDigitalCard?: any;
  material?: string;
  showLogoMobileOnBack: any;
  cardDetails?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    additionalInfo?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    logo?: any;
    customLogo?: any;
    personalizeLogo?: any;
    logoText?: string;
    useLogoImage?: boolean;
    assignedDigitalCard?: any;
    optionalText: any;
    frontLogo?: any;
    backLogo?: any;
    showQRCodeOnBack?: any;
    customCardDesignType: any;
    qrCodePosition: any;
    hideTextOnBack: any;
    tapStickerLogo?: any;
    tapStickerText?: any;
    tapStickerColor?: any;
    cardType?: any;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalSavings: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "shopping_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();

  const [items, setItems] = useState<CartItem[]>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Update localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "id">) => {
    const id = `${item.type}-${Date.now()}-${Math.random()}`;
    const newItem = { ...item, id };

    setItems((prev) => [...prev, newItem]);
    showToast(`${item.name} added to cart`, "success");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Item removed from cart", "success");
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const getTotalSavings = () => {
    return items.reduce((sum, item) => {
      if (item.originalPrice) {
        return sum + (item.originalPrice - item.unitPrice) * item.quantity;
      }
      return sum;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getTotalSavings,
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
