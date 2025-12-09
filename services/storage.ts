import { AppSettings, Transaction } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const KEYS = {
  TRANSACTIONS: 'biztrack_transactions',
  SETTINGS: 'biztrack_settings',
};

export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem(KEYS.SETTINGS);
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const getTransactions = (): Transaction[] => {
  const saved = localStorage.getItem(KEYS.TRANSACTIONS);
  return saved ? JSON.parse(saved) : [];
};

export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  // Check if update or new
  const index = transactions.findIndex(t => t.id === transaction.id);
  if (index >= 0) {
    transactions[index] = transaction;
  } else {
    transactions.push(transaction);
  }
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions().filter(t => t.id !== id);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

// Helper to calculate total value in main currency
export const calculateTotalInMain = (t: Transaction): number => {
  return t.currency === 'MAIN' ? t.amount : t.amount * t.exchangeRate;
};
