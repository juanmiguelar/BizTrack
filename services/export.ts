import { Transaction, AppSettings } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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

const saveAndShareFile = async (fileName: string, data: string, contentType: string, isBase64: boolean = false) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Cache,
        // If it's base64 data (like PDF or Excel binary), we don't need to specify encoding if we pass the base64 string directly? 
        // Actually, for binary files in Capacitor:
        // "Checks if data is a base64 string..." - usually we should leave encoding undefined or specify it.
        // If we want to write text (CSV), we can use Encoding.UTF8.
        // If we want to write binary (PDF/XLSX), we pass base64 string without encoding (or with appropriate handling).
        // Let's rely on the caller passing the correct data format. 
        // For CSV (text), we can pass string. For binary, base64 string.
        encoding: isBase64 ? undefined : Encoding.UTF8, 
      });

      await Share.share({
        title: 'Exportar Archivo',
        text: 'Aquí está tu reporte de BizTrack',
        url: savedFile.uri,
        dialogTitle: 'Compartir reporte',
      });
    } catch (error) {
      console.error('Error sharing file:', error);
      alert('Error al exportar en dispositivo móvil.');
    }
  } else {
    // Web implementation
    const link = document.createElement("a");
    // If it's not base64, assume it's a data URL or raw text that needs processing?
    // The callers below prepare specific formats (data: URI or blob).
    // Let's adapt the callers to handle the web part largely themselves or unify it here?
    // To keep it simple and unintrusive to existing web logic, I'll move the web logic into the specific functions or handle it here if passed a full Data URI.
    
    // Actually, the previous implementation constructed the link in each function.
    // Let's keep the specific web logic in the functions to avoid regression, or move it here.
    // Moving it here is cleaner.
    
    let href = '';
    if (isBase64) {
      href = `data:${contentType};base64,${data}`;
    } else {
       // For CSV, data is the raw string mostly, but we need to encode it.
       // The original CSV logic: encodeURI("data:text/csv;charset=utf-8," + headers + rows)
       // Let's simplify: pass the FULL data URI for web into this function?
       // No, simpler to just let this function handle the "writing".
       href = `data:${contentType};charset=utf-8,${encodeURIComponent(data)}`;
    }
    
    // However, existing PDF export uses doc.save(). Excel uses writeFile.
    // They handle the download themselves.
    // So modifying them to use THIS function mostly for MOBILE is safer.
    // But I will trigger the share/save for mobile here.
  }
};

export const exportToCSV = async (transactions: Transaction[], settings: AppSettings) => {
  const data = prepareData(transactions, settings);
  if (data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
  const csvContent = [headers, ...rows].join('\n');
  const fileName = `reporte_biztrack_${new Date().toISOString().split('T')[0]}.csv`;

  if (Capacitor.isNativePlatform()) {
     await saveAndShareFile(fileName, csvContent, 'text/csv', false);
  } else {
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = async (transactions: Transaction[], settings: AppSettings) => {
  const data = prepareData(transactions, settings);
  if (data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");
  const fileName = `reporte_biztrack_${new Date().toISOString().split('T')[0]}.xlsx`;

  if (Capacitor.isNativePlatform()) {
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    await saveAndShareFile(fileName, wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true);
  } else {
    XLSX.writeFile(workbook, fileName);
  }
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

  if (Capacitor.isNativePlatform()) {
    const pdfOutput = doc.output('datauristring');
    // pdfOutput is "data:application/pdf;base64,....."
    const base64Data = pdfOutput.split(',')[1];
    const fileName = `reporte_biztrack_${new Date().toISOString().split('T')[0]}.pdf`;
    saveAndShareFile(fileName, base64Data, 'application/pdf', true);
  } else {
    doc.save(`reporte_biztrack_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};
