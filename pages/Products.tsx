import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getProducts, saveProduct, deleteProduct } from '../services/db';
import { CATEGORIES } from '../constants';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: CATEGORIES[1],
    price: 0,
    description: '',
    active: true
  });

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await getProducts();
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: CATEGORIES[1],
        price: 0,
        description: '',
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : '', // Let saveProduct handle ID gen for new items
      name: formData.name!,
      category: formData.category!,
      price: Number(formData.price),
      description: formData.description || '',
      active: formData.active!
    };

    await saveProduct(newProduct);
    await loadProducts();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Tem certeza que deseja excluir este produto?")) {
          await deleteProduct(id);
          await loadProducts();
      }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-dark-bg p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Produtos</h1>
          <p className="text-gray-400">Adicione, edite ou desative itens do cardápio.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text"
          placeholder="Buscar produto..."
          className="w-full bg-dark-surface border border-dark-border rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-coffee-500 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-dark-border bg-dark-surface shadow-xl">
        {isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando produtos...</div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-800/50 text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="p-4 font-medium">Produto</th>
              <th className="p-4 font-medium hidden md:table-cell">Categoria</th>
              <th className="p-4 font-medium">Preço</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{product.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-300 hidden md:table-cell">{product.category}</td>
                <td className="p-4 text-white font-medium">R$ {product.price.toFixed(2)}</td>
                <td className="p-4 text-center">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${product.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(product)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-coffee-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-coffee-500 outline-none"
                  >
                    {CATEGORIES.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-coffee-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-coffee-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 bg-dark-bg p-3 rounded-lg border border-dark-border">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  className="w-5 h-5 accent-coffee-500 rounded cursor-pointer"
                />
                <label htmlFor="active" className="text-white cursor-pointer select-none">Produto Ativo (Disponível no PDV)</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-dark-border text-gray-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg bg-coffee-500 text-white font-bold hover:bg-coffee-600 shadow-lg shadow-coffee-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
