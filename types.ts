export type TransactionType = 'INCOME' | 'EXPENSE';
export type CurrencyType = 'MAIN' | 'SECONDARY';

export interface AppSettings {
  currencyMain: string; // e.g., 'USD'
  currencySecondary: string; // e.g., 'EUR'
  enableDualCurrency: boolean;
  categoriesIncome: string[];
  categoriesExpense: string[];
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  amount: number;
  currency: CurrencyType;
  exchangeRate: number; // Conversion rate to Main currency (1 if Main)
  category: string;
  description: string;
  photo?: string; // Base64 string
}

export interface DateRange {
  start: string; // ISO Date string (YYYY-MM-DD)
  end: string;   // ISO Date string (YYYY-MM-DD)
}
