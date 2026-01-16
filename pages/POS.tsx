import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, Customer, Sale, User, PaymentMethodType, Payment, CashRegisterSession } from '../types';
import { getProducts, getCurrentSession, saveCurrentSession, getCustomers, saveSale, generateUUID } from '../services/db';
import { CATEGORIES } from '../constants';
import { Search, Plus, Minus, Trash2, UserPlus, X, CreditCard, Banknote, QrCode, CheckCircle, Coffee } from 'lucide-react';

interface POSProps {
  currentUser: User;
}

const POS: React.FC<POSProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastChange, setLastChange] = useState(0);

  // Customers Logic
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Payment Logic
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>('');
  
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        const [prodData, custData, sessData] = await Promise.all([
            getProducts(),
            getCustomers(),
            getCurrentSession()
        ]);
        setProducts(prodData.filter(p => p.active));
        setCustomers(custData);
        setSession(sessData);
        setIsLoading(false);
    };
    loadData();
  }, []);

  const isSessionOpen = session?.status === 'OPEN';

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remainingTotal = Math.max(0, cartTotal - totalPaid);

  const handleOpenPayment = () => {
    if (!isSessionOpen) {
      alert('O caixa está fechado! Abra o caixa antes de vender.');
      return;
    }
    if (cart.length === 0) return;
    setPayments([]);
    setCurrentPaymentAmount(cartTotal.toFixed(2));
    setIsPaymentModalOpen(true);
  };

  const addPayment = (method: PaymentMethodType) => {
    const amount = parseFloat(currentPaymentAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    setPayments(prev => [...prev, { method, amount }]);
    
    // Auto adjust next suggested amount
    const paidSoFar = totalPaid + amount;
    const remaining = Math.max(0, cartTotal - paidSoFar);
    setCurrentPaymentAmount(remaining.toFixed(2));
  };

  const removePayment = (index: number) => {
      const removedPayment = payments[index];
      setPayments(prev => prev.filter((_, i) => i !== index));
      
      // Recalculate remaining to show in input
      const newTotalPaid = totalPaid - removedPayment.amount;
      const remaining = Math.max(0, cartTotal - newTotalPaid);
      setCurrentPaymentAmount(remaining.toFixed(2));
  }

  const finalizeSale = async () => {
    if (totalPaid < cartTotal) {
      alert('Valor pago insuficiente.');
      return;
    }

    if (!session) return;

    const change = totalPaid - cartTotal;
    
    const newSale: Sale = {
      id: generateUUID(), // Replaced crypto.randomUUID
      timestamp: Date.now(),
      items: cart,
      total: cartTotal,
      payments: payments,
      change: change,
      operatorId: currentUser.id,
      customerId: selectedCustomer?.id
    };

    try {
        await saveSale(newSale, session.id);
        
        // Update local session state to reflect new sale immediately (optional but good for UX)
        // Note: We don't need to re-fetch everything, just know it's done.
        
        // Reset UI
        setLastChange(change);
        setIsPaymentModalOpen(false);
        setIsSuccessModalOpen(true);
        setCart([]);
        setSelectedCustomer(null);
        setPayments([]);
    } catch (e) {
        console.error(e);
        alert("Erro ao salvar venda. Verifique a conexão.");
    }
  };

  if (isLoading) {
      return <div className="h-full flex items-center justify-center text-white">Carregando PDV...</div>;
  }

  if (!isSessionOpen) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-dark-bg text-gray-400">
        <div className="p-8 bg-dark-surface rounded-2xl border border-dark-border text-center max-w-md">
          <DollarSignOff size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold text-white mb-2">Caixa Fechado</h2>
          <p className="mb-6">Você precisa abrir o caixa para realizar vendas.</p>
          <div className="bg-amber-900/20 text-amber-500 p-4 rounded-lg text-sm">
            Vá para o menu "Caixa" para iniciar as operações do dia.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-dark-bg">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header / Search */}
        <div className="p-4 bg-dark-bg border-b border-dark-border shrink-0 z-10">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text"
                placeholder="Buscar produto..."
                className="w-full bg-dark-surface border border-dark-border rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-coffee-500 focus:outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedCustomer ? (
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="flex items-center gap-2 px-4 py-3 bg-coffee-500/20 text-coffee-500 border border-coffee-500 rounded-xl hover:bg-coffee-500/30 transition-colors"
              >
                <CheckCircle size={18} />
                <span className="font-medium truncate max-w-[150px]">{selectedCustomer.name}</span>
                <X size={16} className="ml-1" />
              </button>
            ) : (
              <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-gray-300 hover:text-white hover:border-coffee-500 transition-all"
              >
                <UserPlus size={20} />
                <span className="hidden md:inline">Cliente (Opcional)</span>
              </button>
            )}
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-coffee-500 text-white' 
                    : 'bg-dark-surface text-gray-400 hover:bg-dark-border hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 md:pb-0">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col justify-between bg-dark-surface border border-dark-border rounded-xl overflow-hidden hover:border-coffee-500 hover:shadow-lg hover:shadow-coffee-500/10 transition-all group text-left h-32 p-4"
              >
                <div>
                  <h3 className="font-medium text-gray-200 line-clamp-2 leading-tight mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                <div className="flex justify-between items-end">
                    <p className="font-bold text-coffee-500 text-lg">R$ {product.price.toFixed(2)}</p>
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 group-hover:bg-coffee-500 group-hover:text-white transition-colors">
                        <Plus size={16} />
                    </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-96 bg-dark-surface border-l border-dark-border flex flex-col h-[40vh] md:h-full shrink-0 shadow-2xl relative z-20 rounded-t-3xl md:rounded-none">
        <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-surface rounded-t-3xl md:rounded-none">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-coffee-500 rounded-full"></span>
                Pedido
            </h2>
            <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">Limpar</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                    <Coffee size={48} className="mb-2" />
                    <p>Selecione produtos</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex gap-3 bg-dark-bg p-3 rounded-xl border border-dark-border">
                        <div className="flex-1">
                            <h4 className="font-medium text-white">{item.name}</h4>
                            <p className="text-sm text-coffee-500 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-dark-surface rounded-lg px-2 border border-dark-border">
                            <button onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)} className="p-1 text-gray-400 hover:text-white">
                                <Minus size={16} />
                            </button>
                            <span className="font-medium w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-400 hover:text-white">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-4 bg-dark-surface border-t border-dark-border">
            <div className="flex justify-between items-end mb-4">
                <span className="text-gray-400">Total</span>
                <span className="text-3xl font-bold text-white">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button
                onClick={handleOpenPayment}
                disabled={cart.length === 0}
                className="w-full bg-coffee-500 hover:bg-coffee-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-coffee-500/20 active:scale-95 transition-all"
            >
                Finalizar Venda
            </button>
        </div>
      </div>

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Selecionar Cliente</h3>
                    <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-500 hover:text-white"><X /></button>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white mb-4 focus:ring-1 focus:ring-coffee-500 focus:outline-none"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                />

                <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                    {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(customer => (
                        <button
                            key={customer.id}
                            onClick={() => { setSelectedCustomer(customer); setIsCustomerModalOpen(false); }}
                            className="w-full text-left p-3 rounded-lg bg-dark-bg hover:bg-coffee-500/10 border border-transparent hover:border-coffee-500/50 transition-colors flex justify-between items-center"
                        >
                            <span className="font-medium text-white">{customer.name}</span>
                            {customer.cpf && <span className="text-xs text-gray-500">{customer.cpf}</span>}
                        </button>
                    ))}
                    {customers.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum cliente cadastrado.</p>}
                </div>
                
                <div className="pt-4 border-t border-dark-border">
                  <button onClick={() => setIsCustomerModalOpen(false)} className="w-full py-2 text-gray-400 hover:text-white">Cancelar</button>
                </div>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-dark-border flex justify-between items-center bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-white">Pagamento</h3>
                        <p className="text-gray-400 text-sm">Total a pagar: <span className="text-white font-bold">R$ {cartTotal.toFixed(2)}</span></p>
                    </div>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-500 hover:text-white"><X /></button>
                </div>

                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                         <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">Valor a receber</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={currentPaymentAmount}
                                    onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-3 text-white text-xl font-bold focus:ring-2 focus:ring-coffee-500 outline-none"
                                />
                            </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button onClick={() => addPayment(PaymentMethodType.CASH)} className="flex flex-col items-center justify-center p-4 bg-dark-bg border border-dark-border rounded-xl hover:bg-green-900/20 hover:border-green-500/50 hover:text-green-400 transition-all text-gray-300">
                            <Banknote className="mb-2" /> Dinheiro
                        </button>
                        <button onClick={() => addPayment(PaymentMethodType.PIX)} className="flex flex-col items-center justify-center p-4 bg-dark-bg border border-dark-border rounded-xl hover:bg-teal-900/20 hover:border-teal-500/50 hover:text-teal-400 transition-all text-gray-300">
                            <QrCode className="mb-2" /> PIX
                        </button>
                        <button onClick={() => addPayment(PaymentMethodType.DEBIT)} className="flex flex-col items-center justify-center p-4 bg-dark-bg border border-dark-border rounded-xl hover:bg-blue-900/20 hover:border-blue-500/50 hover:text-blue-400 transition-all text-gray-300">
                            <CreditCard className="mb-2" /> Débito
                        </button>
                        <button onClick={() => addPayment(PaymentMethodType.CREDIT)} className="flex flex-col items-center justify-center p-4 bg-dark-bg border border-dark-border rounded-xl hover:bg-blue-900/20 hover:border-blue-500/50 hover:text-blue-400 transition-all text-gray-300">
                            <CreditCard className="mb-2" /> Crédito
                        </button>
                    </div>

                    {/* Payments List */}
                    <div className="mb-6 bg-dark-bg rounded-xl p-4 min-h-[100px] border border-dark-border">
                        {payments.length === 0 && <p className="text-center text-gray-600 text-sm mt-4">Nenhum pagamento registrado</p>}
                        {payments.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center mb-2 last:mb-0 border-b border-gray-800 pb-2 last:pb-0 last:border-0">
                                <span className="text-gray-300 text-sm">{p.method}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-white">R$ {p.amount.toFixed(2)}</span>
                                    <button onClick={() => removePayment(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="text-sm">
                            <span className="text-gray-400">Restante: </span>
                            <span className={`font-bold ${remainingTotal > 0 ? 'text-red-400' : 'text-green-400'}`}>R$ {remainingTotal.toFixed(2)}</span>
                        </div>
                         <div className="text-sm">
                            <span className="text-gray-400">Troco: </span>
                            <span className="font-bold text-coffee-500">R$ {Math.max(0, totalPaid - cartTotal).toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={finalizeSale}
                        disabled={totalPaid < cartTotal}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                    >
                        Confirmar Pagamento
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/40">
                      <CheckCircle size={48} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Venda Realizada!</h2>
                  <p className="text-gray-400 mb-8">O registro foi salvo com sucesso.</p>
                  
                  {lastChange > 0 && (
                      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-8 inline-block min-w-[200px]">
                          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Troco</p>
                          <p className="text-4xl font-bold text-coffee-500">R$ {lastChange.toFixed(2)}</p>
                      </div>
                  )}

                  <div className="block">
                    <button 
                        onClick={() => setIsSuccessModalOpen(false)}
                        className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 rounded-full transition-colors"
                    >
                        Nova Venda
                    </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

const DollarSignOff = ({ size, className }: { size: number, className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M17.5 19c0 1.7-1.3 3-3 3h-5c-1.7 0-3-1.3-3-3a5 5 0 0 1 .5-2.5"></path>
      <path d="M14 11a5 5 0 0 0-7.5 7.5"></path>
      <path d="M17.5 9.5c0-1.7-1.3-3-3-3h-5C8.1 6.5 7 7.4 6.3 8.6"></path>
      <path d="M9 2h6"></path>
    </svg>
);

export default POS;