import { api } from '@/lib/axios';

/** Orçamento oficial calculado pelo backend (preços do banco + prazo + cupom). */
export interface Quote {
    months: number;
    originalValue: number;
    termDiscountPercent: number;
    termDiscount: number;
    couponDiscount: number;
    finalValue: number;
    monthlyValue: number;
    coupon: { code: string; discountType: 'PERCENTAGE' | 'FIXED_VALUE'; value: number } | null;
    items: { panelId: string; priceSnapshot: number }[];
}

export const pricingService = {
    async quote(panelIds: string[], months: number, couponCode?: string | null): Promise<Quote> {
        const { data } = await api.post<Quote>('/pricing/quote', { panelIds, months, couponCode: couponCode || undefined });
        return data;
    },
};

/** Texto amigável do desconto do cupom. */
export function describeCoupon(coupon: NonNullable<Quote['coupon']>) {
    return coupon.discountType === 'PERCENTAGE'
        ? `${coupon.value}% OFF`
        : `R$ ${coupon.value.toFixed(2).replace('.', ',')} OFF`;
}
