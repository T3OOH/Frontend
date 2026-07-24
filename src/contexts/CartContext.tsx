// =========================================================================
// DOCUMENTAÇÃO TÉCNICA: CART CONTEXT (GLOBAL STATE)
// Padrão: State Container / Provider Pattern
// Responsabilidade: Gerenciar o estado do carrinho transversalmente na aplicação.
// Inclui persistência via LocalStorage para resiliência de UX (evita perda
// de carrinho em reloads acidentais).
// =========================================================================

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export interface Panel {
    id: string;
    name: string;
    city: string;
    state: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    price?: number | string;
    impacts: string;    // Obrigatório como string
    images?: string[];
    size: string;       // Obrigatório para o InteractiveMap
    px: string;         // Obrigatório para o InteractiveMap
    lat: number;
    lng: number;
    [key: string]: any;
}

interface CartContextData {
    cart: Panel[];
    toggleInCart: (panel: Panel) => void;
    clearCart: () => void;
    isInCart: (panelId: string) => boolean;
    totalPrice: number;
    totalImpacts: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const parseImpacts = (impactStr?: string | number): number => {
    if (!impactStr) return 0;
    if (typeof impactStr === 'number') return impactStr;
    const normalized = String(impactStr).toLowerCase().trim();
    const numMatch = normalized.match(/[\d.,]+/);
    if (!numMatch) return 0;
    
    let numStr = numMatch[0].replace(',', '.');
    if (normalized.includes('mi') || normalized.includes('m') || normalized.includes('milh')) return parseFloat(numStr) * 1000000;
    if (normalized.includes('k') || normalized.includes('mil')) return parseFloat(numStr) * 1000;
    
    return parseInt(numStr.replace(/\./g, ''), 10);
};

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<Panel[]>(() => {
        try {
            const saved = localStorage.getItem('@t3ooh:cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('@t3ooh:cart', JSON.stringify(cart));
    }, [cart]);

    const toggleInCart = (panel: Panel) => {
        setCart((prev) => {
            const exists = prev.some(item => item.id === panel.id);
            return exists ? prev.filter(item => item.id !== panel.id) : [...prev, panel];
        });
    };

    const clearCart = () => setCart([]);
    const isInCart = (panelId: string) => cart.some(item => item.id === panelId);

    const totals = useMemo(() => {
        return cart.reduce((acc, panel) => ({
            price: acc.price + (Number(panel.price) || 0),
            impacts: acc.impacts + parseImpacts(panel.impacts)
        }), { price: 0, impacts: 0 });
    }, [cart]);

    return (
        <CartContext.Provider value={{ 
            cart, 
            toggleInCart, 
            clearCart, 
            isInCart,
            totalPrice: totals.price,
            totalImpacts: totals.impacts
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};