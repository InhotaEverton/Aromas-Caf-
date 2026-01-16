import React, { useState, useEffect, useMemo } from 'react';
import { getSessionHistory } from '../services/db';
import { Sale, PaymentMethodType } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  CreditCard,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';

type TimeRange = 'today' | '7days' | '30days' | 'all';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [isLoading, setIsLoading] = useState(true);

  // Load all sales from session history
  useEffect(() => {
    const loadHistory = async () => {
        setIsLoading(true);
        const sessions = await getSessionHistory();
        const allSales = sessions.flatMap(session => session.sales);
        setSales(allSales);
        setIsLoading(false);
    };
    loadHistory();
  }, []);

  // Filter and Process Data based on TimeRange
  const { kpis, chartData, paymentData, topProducts } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let cutoffTime = 0;
    switch (timeRange) {
      case 'today':
        cutoffTime = startOfToday;
        break;
      case '7days':
        cutoffTime = new Date(now.setDate(now.getDate() - 7)).getTime();
        break;
      case '30days':
        cutoffTime = new Date(now.setDate(now.getDate() - 30)).getTime();
        break;
      case 'all':
        cutoffTime = 0;
        break;
    }

    const filteredSales = sales.filter(s => s.timestamp >= cutoffTime);

    // 1. KPIs
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const count = filteredSales.length;
    const avgTicket = count > 0 ? totalRevenue / count : 0;

    // 2. Product Ranking
    const productStats: Record<string, { name: string, qty: number, total: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        if (!productStats[item.id]) {
          productStats[item.id] = { name: item.name, qty: 0, total: 0 };
        }
        productStats[item.id].qty += item.quantity;
        productStats[item.id].total += item.price * item.quantity;
      });
    });
    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    
    const bestSeller = sortedProducts.length > 0 ? sortedProducts[0].name : '-';

    // 3. Line Chart Data (Evolution)
    const dailyStats: Record<string, number> = {};
    filteredSales.forEach(s => {
      const date = new Date(s.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dailyStats[date] = (dailyStats[date] || 0) + s.total;
    });
    
    // Sort dates properly
    const sortedDates = Object.keys(dailyStats).sort((a, b) => {
       const [dayA, monthA] = a.split('/').map(Number);
       const [dayB, monthB] = b.split('/').map(Number);
       return new Date(2024, monthA - 1, dayA).getTime() - new Date(2024, monthB - 1, dayB).getTime();
    });

    const lineData = sortedDates.map(date => ({
      date,
      total: dailyStats[date]
    }));

    // 4. Bar Chart Data (Payment Methods)
    const methodStats: Record<string, number> = {};
    filteredSales.forEach(s => {
      s.payments.forEach(p => {
        methodStats[p.method] = (methodStats[p.method] || 0) + p.amount;
      });
      // Subtract change from cash payments for accurate revenue
      if (s.change > 0 && methodStats[PaymentMethodType.CASH]) {
        methodStats[PaymentMethodType.CASH] -= s.change;
      }
    });

    const barData = Object.entries(methodStats).map(([method, amount]) => ({
      name: method,
      value: amount
    }));

    return {
      kpis: { totalRevenue, avgTicket, bestSeller, count },
      chartData: lineData,
      paymentData: barData,
      topProducts: sortedProducts
    };
  }, [sales, timeRange]);

  return (
    <div className="h-full bg-dark-bg p-6 overflow-y-auto">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-coffee-500" /> Relatórios
          </h1>
          <p className="text-gray-400 text-sm">Visão geral do desempenho de vendas.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-lg p-1">
          <div className="px-3 py-2 text-gray-400">
            <Filter size={18} />
          </div>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="bg-transparent text-white border-none outline-none text-sm font-medium pr-8 py-2 cursor-pointer"
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="all">Todo o período</option>
          </select>
        </div>
      </div>

      {isLoading ? (
          <div className="text-center text-gray-400 mt-20">Carregando dados...</div>
      ) : (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 relative overflow-hidden group hover:border-coffee-500/50 transition-all">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-coffee-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Faturamento</p>
          <h3 className="text-3xl font-bold text-white">R$ {kpis.totalRevenue.toFixed(2)}</h3>
          <p className="text-xs text-gray-500 mt-2">{kpis.count} vendas realizadas</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 relative overflow-hidden group hover:border-coffee-500/50 transition-all">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-green-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Ticket Médio</p>
          <h3 className="text-3xl font-bold text-white">R$ {kpis.avgTicket.toFixed(2)}</h3>
          <p className="text-xs text-gray-500 mt-2">Média por venda</p>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 relative overflow-hidden group hover:border-coffee-500/50 transition-all">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag size={64} className="text-blue-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Mais Vendido</p>
          <h3 className="text-xl font-bold text-white line-clamp-2 min-h-[36px] items-center flex">{kpis.bestSeller}</h3>
          <p className="text-xs text-gray-500 mt-2">Campeão de vendas</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart - Evolution */}
        <div className="lg:col-span-2 bg-dark-surface border border-dark-border rounded-2xl p-6">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-coffee-500" />
            Evolução de Vendas
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `R$${value}`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{stroke: '#a67c52', strokeWidth: 2}}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#a67c52" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#a67c52', strokeWidth: 0}}
                  activeDot={{r: 6, fill: '#fff'}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Payment Methods */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <CreditCard size={18} className="text-coffee-500" />
            Pagamentos
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#999" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  width={60}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#a67c52' : '#8c6b44'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <ShoppingBag size={18} className="text-coffee-500" />
          Produtos Mais Vendidos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-gray-500 text-sm border-b border-dark-border">
              <tr>
                <th className="pb-3 font-medium pl-2">Produto</th>
                <th className="pb-3 font-medium text-center">Qtd.</th>
                <th className="pb-3 font-medium text-right pr-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    Nenhum dado no período selecionado.
                  </td>
                </tr>
              )}
              {topProducts.map((prod, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-gray-800 text-gray-400 text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-white font-medium">{prod.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center text-gray-300">{prod.qty}</td>
                  <td className="py-3 text-right text-coffee-500 font-bold pr-2">R$ {prod.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Reports;
