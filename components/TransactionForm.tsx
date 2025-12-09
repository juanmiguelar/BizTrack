import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, AppSettings, CurrencyType } from '../types';
import { Camera, Save, X } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onSave: (t: Transaction) => void;
  onCancel: () => void;
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<Props> = ({ settings, onSave, onCancel, initialData }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'INCOME');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [currency, setCurrency] = useState<CurrencyType>(initialData?.currency || 'MAIN');
  const [exchangeRate, setExchangeRate] = useState<string>(initialData?.exchangeRate.toString() || '1');
  const [category, setCategory] = useState<string>(initialData?.category || '');
  const [date, setDate] = useState<string>(initialData?.date.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [photo, setPhoto] = useState<string | undefined>(initialData?.photo);

  const categories = type === 'INCOME' ? settings.categoriesIncome : settings.categoriesExpense;

  // Set default category if not set
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [type, categories, category]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen es demasiado grande. Intenta con una menor a 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    const finalExchangeRate = currency === 'MAIN' ? 1 : parseFloat(exchangeRate);

    const newTransaction: Transaction = {
      id: initialData?.id || crypto.randomUUID(),
      date: new Date(date).toISOString(),
      type,
      amount: parseFloat(amount),
      currency,
      exchangeRate: finalExchangeRate,
      category,
      description,
      photo
    };
    onSave(newTransaction);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Editar Transacción' : 'Nueva Transacción'}
          </h2>
          <button 
            onClick={onCancel} 
            className="text-slate-500 hover:text-slate-800 bg-white p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-slate-200 outline-none"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
          
          {/* Type Selection */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none ${type === 'INCOME' ? 'bg-white text-emerald-700 shadow-sm ring-emerald-200' : 'bg-transparent text-slate-500 hover:text-slate-700 shadow-none'}`}
              onClick={() => setType('INCOME')}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none ${type === 'EXPENSE' ? 'bg-white text-rose-700 shadow-sm ring-rose-200' : 'bg-transparent text-slate-500 hover:text-slate-700 shadow-none'}`}
              onClick={() => setType('EXPENSE')}
            >
              Egreso
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Monto</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow placeholder:text-slate-400"
                placeholder="0.00"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Moneda</label>
              {settings.enableDualCurrency ? (
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-base text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-[52px]"
                >
                  <option value="MAIN">{settings.currencyMain}</option>
                  <option value="SECONDARY">{settings.currencySecondary}</option>
                </select>
              ) : (
                <div className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-500 font-medium h-[52px] flex items-center justify-center">
                  {settings.currencyMain}
                </div>
              )}
            </div>
          </div>

          {/* Exchange Rate (Conditional) */}
          {currency === 'SECONDARY' && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <label className="block text-sm font-bold text-amber-900 mb-2">
                Tipo de Cambio ({settings.currencySecondary} ➔ {settings.currencyMain})
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Ej: 3.50"
              />
              <p className="text-xs text-amber-800 mt-2 font-medium">
                Total registrado: <span className="font-bold">{(parseFloat(amount || '0') * parseFloat(exchangeRate || '0')).toFixed(2)} {settings.currencyMain}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Fecha</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400"
              placeholder="Detalles adicionales..."
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Comprobante</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all bg-white group touch-manipulation focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                <Camera size={20} className="mr-2 text-slate-400 group-hover:text-blue-500" />
                <span className="text-sm text-slate-600 group-hover:text-blue-600 font-medium">Adjuntar Foto</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              {photo && (
                <div className="relative group shrink-0">
                  <img src={photo} alt="Preview" className="h-14 w-14 object-cover rounded-lg border border-slate-200 shadow-sm" />
                  <button 
                    type="button" 
                    onClick={() => setPhoto(undefined)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                    aria-label="Eliminar foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
             <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors active:scale-[0.98] focus:ring-2 focus:ring-slate-200 focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 active:scale-[0.98] focus:ring-4 focus:ring-blue-100 focus:outline-none"
            >
              <Save size={18} />
              Guardar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TransactionForm;