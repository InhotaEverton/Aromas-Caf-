import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUsers, saveUser, deleteUser } from '../services/db';
import { UserSquare2, Plus, Shield, User as UserIcon, Trash2, Ban, CheckCircle } from 'lucide-react';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        username: '',
        pin: '',
        role: UserRole.OPERATOR,
        active: true
    });

    const loadUsers = async () => {
        setIsLoading(true);
        const data = await getUsers();
        setUsers(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = {
            id: '', // DB/Service handles generation
            name: formData.name!,
            username: formData.username!,
            pin: formData.pin!,
            role: formData.role!,
            active: formData.active !== undefined ? formData.active : true
        };
        await saveUser(newUser);
        await loadUsers();
        setIsFormOpen(false);
        setFormData({ name: '', username: '', pin: '', role: UserRole.OPERATOR, active: true });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
            await deleteUser(id);
            await loadUsers();
        }
    };

    const toggleBlock = async (user: User) => {
        const updatedUser = { ...user, active: !user.active };
        await saveUser(updatedUser);
        await loadUsers();
    };

    return (
        <div className="h-full bg-dark-bg p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <UserSquare2 className="text-coffee-500" /> Usuários
                    </h1>
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Novo Usuário
                    </button>
                </div>

                {isFormOpen && (
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-8 animate-in slide-in-from-top-4">
                        <h3 className="text-lg font-bold text-white mb-4">Cadastrar Usuário</h3>
                        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                                <input required className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Usuário (Login)</label>
                                <input required className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Senha/PIN</label>
                                <input required type="password" className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Função</label>
                                <select className="w-full bg-dark-bg border border-dark-border rounded p-2 text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                                    <option value={UserRole.OPERATOR} className="bg-gray-900 text-white">Operador (Vendas e Caixa)</option>
                                    <option value={UserRole.ADMIN} className="bg-gray-900 text-white">Administrador (Acesso Total)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium">Salvar</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-4">
                    {isLoading && <p className="text-gray-400">Carregando usuários...</p>}
                    {!isLoading && users.map(user => (
                        <div key={user.id} className={`bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center justify-between ${!user.active ? 'opacity-60 grayscale' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === UserRole.ADMIN ? 'bg-amber-900/40 text-amber-500' : 'bg-gray-700 text-gray-300'}`}>
                                    {user.role === UserRole.ADMIN ? <Shield size={20} /> : <UserIcon size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-white flex items-center gap-2">
                                        {user.name}
                                        {!user.active && <span className="text-xs bg-red-500/20 text-red-500 px-2 rounded-full border border-red-500/30">BLOQUEADO</span>}
                                    </p>
                                    <p className="text-sm text-gray-500">@{user.username} • {user.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => toggleBlock(user)} 
                                    className={`p-2 rounded-lg transition-colors ${user.active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
                                    title={user.active ? "Bloquear" : "Desbloquear"}
                                >
                                    {user.active ? <Ban size={18} /> : <CheckCircle size={18} />}
                                </button>
                                <button 
                                    onClick={() => handleDelete(user.id)} 
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="px-3 py-1 rounded-full text-xs font-mono bg-dark-bg border border-dark-border text-gray-400 hidden md:block">
                                    ID: {user.id.slice(-4)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Users;