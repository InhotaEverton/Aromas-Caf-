import React, { useState } from 'react';
import { Coffee } from 'lucide-react';

interface LoginProps {
  onLogin: (user: string, pin: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-surface border border-dark-border rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-coffee-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-coffee-500/30">
            <Coffee size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Aromas Café</h1>
          <p className="text-gray-400">Acesso ao Sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent transition-all"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-coffee-500/20"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-600">
          <p>Sistema interno v1.0 • Nuts Tech Inspired</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
