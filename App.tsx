import React, { useState, useEffect } from 'react';
import { User } from './types';
import { initDB, getUsers } from './services/db';
import Login from './components/Login';
import Layout from './components/Layout';
import POS from './pages/POS';
import Products from './pages/Products';
import CashControl from './pages/CashControl';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Customers from './pages/Customers';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('pos');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check session
  useEffect(() => {
    const init = async () => {
        await initDB();
        const storedUserStr = sessionStorage.getItem('aromas_user');
        if (storedUserStr) {
            const parsedUser = JSON.parse(storedUserStr);
            // Verify validity on reload against DB
            const users = await getUsers();
            const validUser = users.find(u => u.id === parsedUser.id && u.active);
            if (validUser) {
                setCurrentUser(validUser);
            } else {
                sessionStorage.removeItem('aromas_user');
            }
        }
        setIsLoading(false);
    };
    init();
  }, []);

  const handleLogin = async (username: string, pin: string) => {
    setIsLoading(true);
    try {
        const users = await getUsers();
        const user = users.find(u => u.username === username && u.pin === pin);
        
        if (user) {
            if (!user.active) {
                alert('Usuário bloqueado. Contate o administrador.');
            } else {
                setCurrentUser(user);
                sessionStorage.setItem('aromas_user', JSON.stringify(user));
                setCurrentPage('pos');
            }
        } else {
            alert('Usuário ou senha inválidos');
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao conectar com o banco de dados.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('aromas_user');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'pos':
        return <POS currentUser={currentUser!} />;
      case 'cash':
        return <CashControl currentUser={currentUser!} />;
      case 'products':
        return <Products />;
      case 'users':
        return <Users />;
      case 'reports':
        return <Reports />;
      case 'customers':
        return <Customers />;
      default:
        return <POS currentUser={currentUser!} />;
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-dark-bg flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-coffee-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      )
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
