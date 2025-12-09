import { Transaction, AppSettings } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (amount: number, currency: string) => {
  return `${amount.toFixed(2)} ${currency}`;
};

const prepareData = (transactions: Transaction[], settings: AppSettings) => {
  return transactions.map(t => ({
    Fecha: new Date(t.date).toLocaleDateString(),
    Tipo: t.type === 'INCOME' ? 'Ingreso' : 'Egreso',
    Categoría: t.category,
    Descripción: t.description,
    Monto: t.amount,
    Moneda: t.currency === 'MAIN' ? settings.currencyMain : settings.currencySecondary,
    'Tipo de Cambio': t.currency === 'SECONDARY' ? t.exchangeRate : 1,
    'Total (Moneda Principal)': t.currency === 'MAIN' ? t.amount : (t.amount * t.exchangeRate),
  }));
};

export const exportToCSV = (transactions: Transaction[], settings: AppSettings) => {
  const data = prepareData(transactions, settings);
  if (data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `reporte_biztrack_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (transactions: Transaction[], settings: AppSettings) => {
  const data = prepareData(transactions, settings);
  if (data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");
  XLSX.writeFile(workbook, `reporte_biztrack_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToPDF = (transactions: Transaction[], settings: AppSettings, dateRange: { start: string, end: string }) => {
  if (transactions.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text("Reporte Financiero - BizTrack", 14, 22);
  
  // Metadata
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Rango: ${dateRange.start} al ${dateRange.end}`, 14, 30);
  doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 36);

  // Totals Calculation
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (t.currency === 'MAIN' ? t.amount : t.amount * t.exchangeRate), 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (t.currency === 'MAIN' ? t.amount : t.amount * t.exchangeRate), 0);

  const balance = totalIncome - totalExpense;

  doc.text(`Total Ingresos: ${formatCurrency(totalIncome, settings.currencyMain)}`, 14, 46);
  doc.text(`Total Egresos: ${formatCurrency(totalExpense, settings.currencyMain)}`, 14, 52);
  doc.text(`Balance Neto: ${formatCurrency(balance, settings.currencyMain)}`, 14, 58);

  // Table
  const tableColumn = ["Fecha", "Tipo", "Categoría", "Monto", "Moneda", "Total Main"];
  const tableRows = transactions.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.type === 'INCOME' ? 'Ingreso' : 'Egreso',
    t.category,
    t.amount.toLocaleString(),
    t.currency === 'MAIN' ? settings.currencyMain : settings.currencySecondary,
    (t.currency === 'MAIN' ? t.amount : t.amount * t.exchangeRate).toFixed(2)
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 65,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
  });

  doc.save(`reporte_biztrack_${new Date().toISOString().split('T')[0]}.pdf`);
};
