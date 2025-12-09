import React from 'react';
import { Transaction, AppSettings } from '../types';
import { calculateTotalInMain } from '../services/storage';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  settings: AppSettings;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1'];

interface TimelineData {
  date: string;
  income: number;
  expense: number;
}

const Dashboard: React.FC<Props> = ({ transactions, settings }) => {
  
  // Calculate Summaries (Normalized to Main Currency)
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + calculateTotalInMain(t), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + calculateTotalInMain(t), 0);

  const balance = totalIncome - totalExpense;

  // Prepare Data for Charts
  
  // 1. Expense by Category (Pie)
  const expenseByCategory = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + calculateTotalInMain(t);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: parseFloat(expenseByCategory[key].toFixed(2))
  })).sort((a, b) => b.value - a.value);

  // 2. Timeline (Area)
  // Group by Date
  const timelineMap = transactions.reduce((acc, t) => {
    const date = t.date.split('T')[0];
    if (!acc[date]) acc[date] = { date, income: 0, expense: 0 };
    if (t.type === 'INCOME') acc[date].income += calculateTotalInMain(t);
    else acc[date].expense += calculateTotalInMain(t);
    return acc;
  }, {} as Record<string, TimelineData>);

  const areaData = (Object.values(timelineMap) as TimelineData[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
        ...d,
        income: parseFloat(d.income.toFixed(2)),
        expense: parseFloat(d.expense.toFixed(2))
    }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: settings.currencyMain }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Ingresos Totales</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</h3>
          </div>
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Egresos Totales</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalExpense)}</h3>
          </div>
          <div className="p-3 bg-rose-100 rounded-full text-rose-600">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Balance Neto</p>
            <h3 className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </h3>
          </div>
          <div className={`p-3 rounded-full ${balance >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Flujo de Caja (Cronológico)</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12}} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Ingresos" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" name="Egresos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Egresos por Categoría</h4>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-slate-400 text-sm">No hay datos de egresos para mostrar</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;