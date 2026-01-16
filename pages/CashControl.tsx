import React, { useState, useEffect } from 'react';
import { User, CashRegisterSession, PaymentMethodType } from '../types';
import { getCurrentSession, saveCurrentSession } from '../services/db';
import { DollarSign, Lock, Unlock, AlertTriangle, Save, History } from 'lucide-react';

interface CashControlProps {
  currentUser: User;
}

const CashControl: React.FC<CashControlProps> = ({ currentUser }) => {
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [openingValue, setOpeningValue] = useState('');
  const [closingObservations, setClosingObservations] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = async () => {
    setIsLoading(true);
    const s = await getCurrentSession();
    setSession(s);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(openingValue);
    if (isNaN(val) || val < 0) return;

    const newSession: CashRegisterSession = {
      id: crypto.randomUUID(),
      openedAt: Date.now(),
      openingBalance: val,
      operatorId: currentUser.id,
      status: 'OPEN',
      sales: [] // Will be empty on init
    };

    await saveCurrentSession(newSession);
    await loadSession();
    setOpeningValue('');
  };

  const handleCloseRegister = async () => {
    if (!session) return;
    if (!window.confirm("Confirmar fechamento de caixa?")) return;

    const totalSales = session.sales.reduce((acc, sale) => acc + sale.total, 0);
    const expected = session.openingBalance + totalSales;

    const closedSession: CashRegisterSession = {
      ...session,
      status: 'CLOSED',
      closedAt: Date.now(),
      closingBalance: expected, // Simplified: assume perfect count for now
      expectedBalance: expected,
      difference: 0,
      observations: closingObservations
    };

    await saveCurrentSession(closedSession); // Updates the status in DB
    setSession(null);
    setClosingObservations('');
    await loadSession();
  };

  const calculateTotals = () => {
    if (!session) return { total: 0, methods: {} };
    const methods: Record<string, number> = {};
    let total = 0;

    session.sales.forEach(sale => {
      total += sale.total;
      sale.payments.forEach(p => {
        methods[p.method] = (methods[p.method] || 0) + p.amount;
      });
      // Adjust cash for change given
      if (sale.change > 0 && methods[PaymentMethodType.CASH]) {
        methods[PaymentMethodType.CASH] -= sale.change;
      }
    });

    return { total, methods };
  };

  const { total, methods } = calculateTotals();

  if (isLoading) return <div className="p-8 text-white">Carregando caixa...</div>;

  return (
    <div className="h-full bg-dark-bg p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <DollarSign className="text-coffee-500" size={32} />
          Controle de Caixa
        </h1>

        {!session ? (
          // CLOSED STATE -> OPEN FORM
          <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-2xl max-w-lg mx-auto">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} className="text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Caixa Fechado</h2>
              <p className="text-gray-400">Inicie as operações do dia</p>
            </div>

            <form onSubmit={handleOpenRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fundo de Troco (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openingValue}
                    onChange={(e) => setOpeningValue(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-12 pr-4 py-4 text-white text-xl font-bold focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-coffee-500/20 transition-all flex justify-center items-center gap-2"
              >
                <Unlock size={20} /> Abrir Caixa
              </button>
            </form>
          </div>
        ) : (
          // OPEN STATE -> DASHBOARD
          <div className="grid gap-6">
            {/* Status Card */}
            <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
               <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Status</p>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                    Aberto
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Operador: {currentUser.name}</p>
               </div>
               <div className="text-right">
                  <p className="text-gray-400 text-sm">Fundo Inicial</p>
                  <p className="text-xl font-bold text-white">R$ {session.openingBalance.toFixed(2)}</p>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sales Summary */}
              <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Resumo de Vendas</h3>
                <div className="space-y-3">
                  {Object.entries(methods).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{method}</span>
                      <span className="text-white font-bold">R$ {(amount as number).toFixed(2)}</span>
                    </div>
                  ))}
                  {Object.keys(methods).length === 0 && <p className="text-gray-500 text-sm">Nenhuma venda registrada.</p>}
                  
                  <div className="pt-4 mt-2 border-t border-gray-700 flex justify-between items-center text-lg">
                    <span className="text-white font-bold">Total Vendido</span>
                    <span className="text-coffee-500 font-bold">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Expected Cash */}
              <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Posição Atual</h3>
                <div className="flex flex-col gap-4">
                   <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
                      <p className="text-gray-400 text-xs uppercase mb-1">Total em Caixa (Estimado)</p>
                      <p className="text-3xl font-bold text-white">R$ {(session.openingBalance + total).toFixed(2)}</p>
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-sm text-gray-400">Observações de Fechamento</label>
                     <textarea 
                        className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-white text-sm focus:outline-none focus:border-coffee-500"
                        rows={3}
                        value={closingObservations}
                        onChange={(e) => setClosingObservations(e.target.value)}
                        placeholder="Ex: Diferença de centavos, sangrias..."
                     />
                   </div>

                   <button 
                    onClick={handleCloseRegister}
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 mt-2"
                   >
                     <Lock size={18} /> Fechar Caixa
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashControl;
