import React, { useState } from 'react';
import { Transaction, AppSettings } from '../types';
import { Trash2, Edit, ImageIcon, ArrowRightLeft, Calendar, Tag } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  settings: AppSettings;
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, settings, onDelete, onEdit }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-slate-100">
        <p className="text-slate-400">No hay transacciones en este rango de fechas.</p>
      </div>
    );
  }

  // Sort by date desc
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {t.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                     <div className={t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}>
                      {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-xs text-slate-400">{t.currency === 'MAIN' ? settings.currencyMain : settings.currencySecondary}</span>
                     </div>
                     {t.currency === 'SECONDARY' && (
                       <div className="text-[10px] text-slate-400 flex justify-end items-center gap-1">
                          <ArrowRightLeft size={10} /> 
                          TC: {t.exchangeRate}
                       </div>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-3">
                      {t.photo && (
                        <button 
                          onClick={() => setSelectedImage(t.photo!)}
                          className="text-blue-400 hover:text-blue-600 p-1"
                          title="Ver foto"
                        >
                          <ImageIcon size={18} />
                        </button>
                      )}
                      <button 
                          onClick={() => onEdit(t)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title="Editar"
                      >
                          <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if(window.confirm('¿Estás seguro de eliminar esta transacción?')) onDelete(t.id);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sorted.map((t) => (
          <div key={t.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {t.category}
                 </span>
                 <span className="text-xs text-slate-400 flex items-center gap-1">
                   <Calendar size={12} />
                   {new Date(t.date).toLocaleDateString()}
                 </span>
              </div>
              <div className="text-right">
                  <div className={`text-lg font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString()} 
                    <span className="text-xs ml-1">{t.currency === 'MAIN' ? settings.currencyMain : settings.currencySecondary}</span>
                  </div>
              </div>
            </div>

            {t.description && (
               <p className="text-slate-600 text-sm mb-3 pl-1 border-l-2 border-slate-200">
                  {t.description}
               </p>
            )}

            {t.currency === 'SECONDARY' && (
                <div className="text-xs text-slate-400 mb-3 bg-slate-50 p-2 rounded flex items-center gap-2">
                    <ArrowRightLeft size={12} />
                    <span>T. Cambio: {t.exchangeRate}</span>
                    <span className="text-slate-300">|</span>
                    <span>Total {settings.currencyMain}: {(t.amount * t.exchangeRate).toFixed(2)}</span>
                </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                {t.photo ? (
                   <button 
                      onClick={() => setSelectedImage(t.photo!)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100 touch-manipulation"
                   >
                     <ImageIcon size={16} /> Ver Foto
                   </button>
                ) : (
                    <div className="flex-1"></div>
                )}
                
                <button 
                    onClick={() => onEdit(t)}
                    className="p-2.5 text-slate-500 bg-slate-50 rounded-lg active:bg-slate-200 touch-manipulation"
                    title="Editar"
                >
                    <Edit size={20} />
                </button>
                
                <button 
                    onClick={() => {
                        if(window.confirm('¿Eliminar?')) onDelete(t.id);
                    }}
                    className="p-2.5 text-rose-500 bg-rose-50 rounded-lg active:bg-rose-200 touch-manipulation"
                    title="Eliminar"
                >
                    <Trash2 size={20} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative w-full max-w-3xl">
                <img src={selectedImage} alt="Comprobante" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
                <button 
                  className="absolute -top-12 right-0 text-white p-2"
                  onClick={() => setSelectedImage(null)}
                >
                    Cerrar
                </button>
            </div>
        </div>
      )}
    </>
  );
};

export default TransactionList;