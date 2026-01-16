import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { getCustomers, saveCustomer } from '../services/db';
import { Users, Plus, Phone, Mail, FileText } from 'lucide-react';

const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '',
        phone: '',
        email: '',
        cpf: ''
    });

    const loadCustomers = async () => {
        setIsLoading(true);
        const data = await getCustomers();
        setCustomers(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newCustomer: Customer = {
            id: '', // Service handles generation
            name: formData.name!,
            phone: formData.phone,
            email: formData.email,
            cpf: formData.cpf
        };
        await saveCustomer(newCustomer);
        await loadCustomers();
        setIsFormOpen(false);
        setFormData({ name: '', phone: '', email: '', cpf: '' });
    };

    return (
        <div className="h-full bg-dark-bg p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="text-coffee-500" /> Clientes
                    </h1>
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Novo Cliente
                    </button>
                </div>

                {isFormOpen && (
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-8 animate-in slide-in-from-top-4">
                        <h3 className="text-lg font-bold text-white mb-4">Cadastrar Cliente</h3>
                        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                                <input required className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-sm text-gray-400 mb-1">CPF (Opcional)</label>
                                <input className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} placeholder="000.000.000-00"/>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Telefone (Opcional)</label>
                                <input className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email (Opcional)</label>
                                <input type="email" className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                           
                            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium">Salvar</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-4">
                    {isLoading && <p className="text-gray-500">Carregando clientes...</p>}
                    {!isLoading && customers.length === 0 && <p className="text-gray-500">Nenhum cliente cadastrado.</p>}
                    {customers.map(customer => (
                        <div key={customer.id} className="bg-dark-surface border border-dark-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="font-bold text-white text-lg">{customer.name}</p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                                    {customer.cpf && <span className="flex items-center gap-1"><FileText size={14} /> {customer.cpf}</span>}
                                    {customer.phone && <span className="flex items-center gap-1"><Phone size={14} /> {customer.phone}</span>}
                                    {customer.email && <span className="flex items-center gap-1"><Mail size={14} /> {customer.email}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Customers;
