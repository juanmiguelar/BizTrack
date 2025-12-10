import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  List, 
  Settings as SettingsIcon, 
  Plus, 
  Calendar as CalendarIcon,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  File
} from 'lucide-react';
import { AppSettings, Transaction, DateRange } from './types';
import { INITIAL_DATE_RANGE } from './constants';
import * as storage from './services/storage';
import * as exportService from './services/export';

import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import Settings from './components/Settings';

type View = 'DASHBOARD' | 'LIST' | 'SETTINGS';

function App() {
  // Global State
  const [view, setView] = useState<View>('DASHBOARD');
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [transactions, setTransactions] = useState<Transaction[]>(storage.getTransactions());
  
  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);

  // Sync state with storage
  const handleSaveSettings = (newSettings: AppSettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleSaveTransaction = (t: Transaction) => {
    storage.saveTransaction(t);
    setTransactions(storage.getTransactions()); // Refresh
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    storage.deleteTransaction(id);
    setTransactions(storage.getTransactions());
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setShowForm(true);
  };

  // Filter transactions by Date Range
  const filteredTransactions = transactions.filter(t => {
    // Compare YYYY-MM-DD strings
    const tDate = t.date.split('T')[0];
    return tDate >= dateRange.start && tDate <= dateRange.end;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex bg-white border-r border-slate-200 w-64 flex-shrink-0 flex-col sticky top-0 h-screen z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <div className="w-4 h-4 bg-white rounded-full opacity-30" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">BizTrack</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavButton 
            active={view === 'DASHBOARD'} 
            onClick={() => setView('DASHBOARD')} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavButton 
            active={view === 'LIST'} 
            onClick={() => setView('LIST')} 
            icon={<List size={20} />} 
            label="Transacciones" 
          />
          <NavButton 
            active={view === 'SETTINGS'} 
            onClick={() => setView('SETTINGS')} 
            icon={<SettingsIcon size={20} />} 
            label="Configuración" 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-4">
               <div className="flex items-start gap-2 text-amber-600 mb-1">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-bold">Datos Locales</p>
               </div>
               <p className="text-[10px] text-amber-700 leading-snug">
                 Toda la información se guarda únicamente en este navegador. No hay respaldo en la nube.
               </p>
            </div>
            <p className="text-xs text-slate-400 text-center">v1.1.0 - Local Storage</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative pb-24 md:pb-8">
        
        {/* Warning Banner (Mobile only) */}
        <div className="md:hidden w-full bg-white" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }} />

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div className="flex justify-between items-center w-full xl:w-auto">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                  {view === 'DASHBOARD' && 'Resumen'}
                  {view === 'LIST' && 'Movimientos'}
                  {view === 'SETTINGS' && 'Configuración'}
              </h1>
            </div>
            
            {view !== 'SETTINGS' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    {/* Date Picker */}
                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1.5 rounded-lg w-full sm:w-auto focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                        <div className="flex items-center justify-center pl-2 text-slate-500">
                            <CalendarIcon size={18} />
                        </div>
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-sm text-slate-900 font-medium outline-none w-full min-w-0 py-2 sm:py-1"
                            title="Fecha Inicio"
                        />
                        <span className="text-slate-400 font-medium">-</span>
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-sm text-slate-900 font-medium outline-none w-full min-w-0 py-2 sm:py-1"
                            title="Fecha Fin"
                        />
                    </div>

                    {/* Export Dropdown */}
                    <div className="relative w-full sm:w-auto">
                      <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:bg-slate-700 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto touch-manipulation focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                      >
                        <Download size={18} />
                        Exportar
                      </button>
                      
                      {showExportMenu && (
                        <>
                          <div 
                            className="fixed inset-0 z-20" 
                            onClick={() => setShowExportMenu(false)}
                          />
                          <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                             <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                                <span className="text-xs font-bold text-slate-500 uppercase">Formatos</span>
                             </div>
                             <button 
                                onClick={() => { exportService.exportToExcel(filteredTransactions, settings); setShowExportMenu(false); }}
                                className="w-full text-left px-4 py-4 sm:py-3 hover:bg-green-50 text-slate-700 text-sm flex items-center gap-3 transition-colors active:bg-green-100"
                             >
                                <FileSpreadsheet size={18} className="text-green-600" /> Excel (.xlsx)
                             </button>
                             <button 
                                onClick={() => { exportService.exportToCSV(filteredTransactions, settings); setShowExportMenu(false); }}
                                className="w-full text-left px-4 py-4 sm:py-3 hover:bg-blue-50 text-slate-700 text-sm flex items-center gap-3 transition-colors active:bg-blue-100"
                             >
                                <FileText size={18} className="text-blue-600" /> CSV
                             </button>
                             <button 
                                onClick={() => { exportService.exportToPDF(filteredTransactions, settings, dateRange); setShowExportMenu(false); }}
                                className="w-full text-left px-4 py-4 sm:py-3 hover:bg-red-50 text-slate-700 text-sm flex items-center gap-3 transition-colors active:bg-red-100"
                             >
                                <File size={18} className="text-red-600" /> PDF
                             </button>
                          </div>
                        </>
                      )}
                    </div>
                </div>
            )}
        </header>

        {/* Dynamic View */}
        <div className="p-4 md:p-8">
            {view === 'DASHBOARD' && (
                <Dashboard transactions={filteredTransactions} settings={settings} />
            )}
            {view === 'LIST' && (
                <TransactionList 
                    transactions={filteredTransactions} 
                    settings={settings} 
                    onDelete={handleDeleteTransaction}
                    onEdit={handleEditTransaction}
                />
            )}
            {view === 'SETTINGS' && (
                <Settings settings={settings} onSave={handleSaveSettings} />
            )}
        </div>

        {/* Floating Action Button (FAB) */}
        <button
            onClick={() => {
                setEditingTransaction(null);
                setShowForm(true);
            }}
            className="fixed bottom-24 md:bottom-10 right-6 md:right-10 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 z-30 touch-manipulation focus:ring-4 focus:ring-blue-300"
            title="Nueva Transacción"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <Plus size={28} />
        </button>

      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16">
          <MobileNavButton 
            active={view === 'DASHBOARD'} 
            onClick={() => setView('DASHBOARD')} 
            icon={<LayoutDashboard size={24} />} 
            label="Inicio" 
          />
          <MobileNavButton 
            active={view === 'LIST'} 
            onClick={() => setView('LIST')} 
            icon={<List size={24} />} 
            label="Movimientos" 
          />
          <MobileNavButton 
            active={view === 'SETTINGS'} 
            onClick={() => setView('SETTINGS')} 
            icon={<SettingsIcon size={24} />} 
            label="Ajustes" 
          />
        </div>
      </nav>

      {/* Modal Form */}
      {showForm && (
        <TransactionForm 
            settings={settings} 
            onSave={handleSaveTransaction} 
            onCancel={() => {
                setShowForm(false);
                setEditingTransaction(null);
            }} 
            initialData={editingTransaction}
        />
      )}
    </div>
  );
}

// Desktop Nav Helper
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'bg-blue-50 text-blue-700' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Mobile Nav Helper
const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
      active 
        ? 'text-blue-600' 
        : 'text-slate-400'
    }`}
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;