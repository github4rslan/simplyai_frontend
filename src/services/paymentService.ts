
import { API_BASE_URL } from '@/config/api';

export interface PaymentSettings {
  enable_payments: boolean;
  currency: string;
  vat_percentage: number;
  stripe_public_key: string;
}

export const fetchPaymentSettings = async (): Promise<PaymentSettings | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch payment settings');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return null;
  }
};

// Currency display utilities
export const getCurrencySymbol = (currency?: string): string => {
  if (!currency) return "";
  switch (currency.toUpperCase()) {
    case 'EUR': return '€';
    case 'USD': return '$';
    case 'GBP': return '£';
    case 'CHF': return 'CHF ';
    case 'CAD': return 'CA$';
    default: return currency + ' ';
  }
};

export const formatCurrency = (amount: number, currency?: string): string => {
  const safeCurrency = currency || 'EUR';
  const symbol = getCurrencySymbol(safeCurrency);
  const value = (amount / 100).toFixed(2); // Convert from cents to main unit
  
  // For currencies that use symbol after amount
  if (safeCurrency.toUpperCase() === 'CHF') {
    return `${value} ${safeCurrency}`;
  }
  
  return `${symbol}${value}`;
};

export const getCurrencyForStripe = (currency?: string): string => {
  return (currency || 'EUR').toLowerCase();
};
