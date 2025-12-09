import { AppSettings, DateRange } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  currencyMain: 'USD',
  currencySecondary: 'EUR',
  enableDualCurrency: false,
  categoriesIncome: ['Ventas', 'Servicios', 'Rentas', 'Otros'],
  categoriesExpense: ['Inventario', 'Alquiler', 'Salarios', 'Servicios Públicos', 'Marketing', 'Mantenimiento', 'Otros'],
};

export const INITIAL_DATE_RANGE: DateRange = {
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
};
