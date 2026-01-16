import React from 'react';
import { User, UserRole } from '../types';
import { LayoutGrid, ShoppingCart, Coffee, Users, BarChart3, LogOut, DollarSign, UserSquare2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, currentPage, onNavigate }) => {
  const menuItems = [
    { id: 'pos', label: 'PDV', icon: ShoppingCart, allowed: [UserRole.ADMIN, UserRole.OPERATOR] },
    { id: 'cash', label: 'Caixa', icon: DollarSign, allowed: [UserRole.ADMIN, UserRole.OPERATOR] },
    { id: 'products', label: 'Produtos', icon: Coffee, allowed: [UserRole.ADMIN] },
    { id: 'customers', label: 'Clientes', icon: Users, allowed: [UserRole.ADMIN, UserRole.OPERATOR] },
    { id: 'users', label: 'Usuários', icon: UserSquare2, allowed: [UserRole.ADMIN] },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, allowed: [UserRole.ADMIN, UserRole.OPERATOR] },
  ];

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text overflow-hidden">
      {/* Sidebar */}
      <aside className="w-24 md:w-64 bg-dark-surface border-r border-dark-border flex flex-col justify-between shrink-0 transition-all duration-300">
        <div>
          <div className="p-6 flex items-center justify-center md:justify-start gap-3 border-b border-dark-border">
            <div className="w-10 h-10 rounded-full bg-coffee-500 flex items-center justify-center text-white font-bold shrink-0">
              AC
            </div>
            <h1 className="hidden md:block text-xl font-bold tracking-tight text-white">Aromas Café</h1>
          </div>
          
          <nav className="mt-6 px-2 md:px-4 space-y-2">
            {menuItems.map((item) => {
              if (!item.allowed.includes(currentUser.role)) return null;
              
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-coffee-500 text-white shadow-lg shadow-coffee-500/20' 
                      : 'text-gray-400 hover:bg-dark-border hover:text-white'
                  }`}
                >
                  <item.icon size={22} />
                  <span className="hidden md:block font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-dark-border">
          <div className="hidden md:flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.role === UserRole.ADMIN ? 'Administrador' : 'Operador'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden md:block font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
         {children}
      </main>
    </div>
  );
};

export default Layout;
