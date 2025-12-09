import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Save, Plus, Trash2, AlertCircle, X } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newIncome, setNewIncome] = useState('');
  const [newExpense, setNewExpense] = useState('');

  // Sincronizar estado local si las props cambian
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Función auxiliar para guardar y actualizar estado local
  const saveAndPersist = (newSettings: AppSettings) => {
    setLocalSettings(newSettings);
    onSave(newSettings); // Esto dispara el guardado en localStorage en App.tsx
  };

  const handleCurrencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    alert('Configuración de monedas guardada correctamente.');
  };

  const handleAddCategory = (e: React.MouseEvent | React.KeyboardEvent, type: 'INCOME' | 'EXPENSE') => {
    if ((e as React.KeyboardEvent).key && (e as React.KeyboardEvent).key !== 'Enter') return;
    
    e.preventDefault();

    const val = type === 'INCOME' ? newIncome : newExpense;
    if (!val.trim()) return;
    
    const cleanVal = val.trim();
    const currentList = type === 'INCOME' ? localSettings.categoriesIncome : localSettings.categoriesExpense;

    if (currentList.some(c => c.toLowerCase() === cleanVal.toLowerCase())) {
        alert('Esta categoría ya existe.');
        return;
    }

    const updatedSettings = { ...localSettings };
    
    if (type === 'INCOME') {
      updatedSettings.categoriesIncome = [...updatedSettings.categoriesIncome, cleanVal];
      setNewIncome('');
    } else {
      updatedSettings.categoriesExpense = [...updatedSettings.categoriesExpense, cleanVal];
      setNewExpense('');
    }

    saveAndPersist(updatedSettings);
  };

  // Simplified remove function without confirm dialog for immediate action
  const removeCategory = (type: 'INCOME' | 'EXPENSE', categoryName: string) => {
    const updatedSettings = { ...localSettings };
    
    if (type === 'INCOME') {
      updatedSettings.categoriesIncome = updatedSettings.categoriesIncome.filter(c => c !== categoryName);
    } else {
      updatedSettings.categoriesExpense = updatedSettings.categoriesExpense.filter(c => c !== categoryName);
    }

    saveAndPersist(updatedSettings);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-20 md:mb-0">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Configuración</h2>
      
      {/* Currency Section */}
      <form onSubmit={handleCurrencySubmit} className="space-y-4 mb-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
             <h3 className="text-lg font-semibold text-slate-800">Monedas</h3>
             <span className="text-xs text-slate-400 font-medium">Requiere guardar cambios</span>
          </div>
          
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input 
              type="checkbox" 
              id="dualCurrency"
              checked={localSettings.enableDualCurrency}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, enableDualCurrency: e.target.checked }))}
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer bg-white"
            />
            <label htmlFor="dualCurrency" className="text-base font-medium text-slate-700 cursor-pointer select-none">Habilitar Segunda Moneda</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Moneda Principal</label>
              <input 
                type="text" 
                value={localSettings.currencyMain}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, currencyMain: e.target.value.toUpperCase() }))}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow placeholder:text-slate-400 font-bold"
                maxLength={5}
                placeholder="USD"
              />
            </div>
            
            {localSettings.enableDualCurrency && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Moneda Secundaria</label>
                <input 
                  type="text" 
                  value={localSettings.currencySecondary}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, currencySecondary: e.target.value.toUpperCase() }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow placeholder:text-slate-400 font-bold"
                  maxLength={5}
                  placeholder="EUR"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 focus:ring-4 focus:ring-blue-100 text-sm"
            >
                <Save size={18} />
                Guardar Monedas
            </button>
          </div>
      </form>

      {/* Categories Section - Totally separated from Form */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
             <h3 className="text-lg font-semibold text-slate-800">Categorías</h3>
             <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <AlertCircle size={12} /> Guardado automático
             </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Income Cats */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-96 shadow-inner">
                <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    Ingresos
                </h4>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3 custom-scrollbar">
                    {localSettings.categoriesIncome.map((cat) => (
                        <div key={`inc-${cat}`} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                            <span className="text-slate-800 font-medium truncate mr-2">{cat}</span>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeCategory('INCOME', cat);
                              }}
                              className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 p-2 rounded-lg transition-colors flex-shrink-0 touch-manipulation border border-transparent hover:border-red-200"
                              title="Eliminar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    {localSettings.categoriesIncome.length === 0 && (
                        <p className="text-xs text-slate-400 text-center italic mt-4">Sin categorías</p>
                    )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <input 
                        type="text"
                        value={newIncome}
                        onChange={(e) => setNewIncome(e.target.value)}
                        onKeyDown={(e) => handleAddCategory(e, 'INCOME')}
                        placeholder="Nueva..."
                        className="flex-1 text-sm bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 placeholder:text-slate-400"
                    />
                    <button 
                        type="button" 
                        onClick={(e) => handleAddCategory(e, 'INCOME')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg transition-colors shadow-sm active:scale-95 flex-shrink-0"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Expense Cats */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-96 shadow-inner">
                <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    Egresos
                </h4>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3 custom-scrollbar">
                    {localSettings.categoriesExpense.map((cat) => (
                        <div key={`exp-${cat}`} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                            <span className="text-slate-800 font-medium truncate mr-2">{cat}</span>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeCategory('EXPENSE', cat);
                              }}
                              className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 p-2 rounded-lg transition-colors flex-shrink-0 touch-manipulation border border-transparent hover:border-red-200"
                              title="Eliminar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                     {localSettings.categoriesExpense.length === 0 && (
                        <p className="text-xs text-slate-400 text-center italic mt-4">Sin categorías</p>
                    )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <input 
                        type="text"
                        value={newExpense}
                        onChange={(e) => setNewExpense(e.target.value)}
                        onKeyDown={(e) => handleAddCategory(e, 'EXPENSE')}
                        placeholder="Nueva..."
                        className="flex-1 text-sm bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 placeholder:text-slate-400"
                    />
                    <button 
                        type="button" 
                        onClick={(e) => handleAddCategory(e, 'EXPENSE')}
                        className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-lg transition-colors shadow-sm active:scale-95 flex-shrink-0"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
          </div>
      </section>
    </div>
  );
};

export default Settings;