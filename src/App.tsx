/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { 
  LayoutDashboard, 
  Users, 
  Scissors, 
  Calendar, 
  DollarSign, 
  FileText, 
  LogOut,
  Scissors as ScissorsIcon,
  Menu,
  X,
  TrendingUp,
  Plus,
  Package,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Views
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Services from './components/Services';
import Products from './components/Products';
import Appointments from './components/Appointments';
import Finance from './components/Finance';
import Reports from './components/Reports';
import PwaInstallBanner from './components/PwaInstallBanner';

type View = 'dashboard' | 'clientes' | 'servicos' | 'produtos' | 'agendamentos' | 'financeiro' | 'relatorios';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Handle redirect result for environments where popup fails and redirects (like some APKs)
    getRedirectResult(auth).catch((error) => {
      console.error("Erro ao processar redirecionamento:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error(error);
      // Only show error if it's not a user cancellation
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        setLoginError('Falha ao entrar com Google. Tente novamente.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center transition-colors duration-300", isDarkMode ? "bg-black" : "bg-white")}>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-gold"
        >
          <ScissorsIcon size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300", isDarkMode ? "bg-[#050505] text-[#e5e5e5]" : "bg-zinc-50 text-zinc-900")}>
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-bg p-8 md:p-12 w-full max-w-md text-center rounded-2xl gold-border"
        >
          <div className="w-16 h-16 rounded-xl gold-gradient flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-900/20">
            <span className="text-black font-bold text-3xl">B</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-white">Barber<span className="gold-text">Pro</span></h1>
          <p className="text-zinc-500 mb-8">O sistema definitivo para barbearias de alto nível.</p>
          
          <button 
            disabled={loginLoading}
            onClick={handleLogin}
            className="w-full btn-primary flex items-center justify-center gap-3 py-3 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {loginLoading ? (
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
               >
                 <ScissorsIcon size={20} />
               </motion.div>
            ) : (
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale" alt="Google" />
            )}
            {loginLoading ? 'Conectando...' : 'Entrar com Google'}
          </button>

          {loginError && (
             <p className="mt-4 text-xs text-red-500 font-medium">
               {loginError}
             </p>
          )}
          
          <p className="mt-8 text-xs text-zinc-500 uppercase tracking-widest">Premium Finance Management</p>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agendamentos', label: 'Agenda', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'servicos', label: 'Serviços', icon: Scissors },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className={cn("min-h-screen flex transition-colors duration-300", isDarkMode ? "dark bg-black text-[#e5e5e5]" : "bg-zinc-50 text-zinc-900")}>
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={cn(
          "fixed inset-y-0 left-0 w-64 border-r z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static",
          isDarkMode ? "bg-black border-[#1f1f1f]" : "bg-white border-zinc-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center shadow-lg shadow-yellow-900/20">
              <span className="text-black font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Barber<span className="gold-text">Pro</span></span>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4 font-sans">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as View);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-semibold",
                  currentView === item.id 
                    ? "sidebar-active" 
                    : isDarkMode 
                      ? "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className={cn("p-4 border-t", isDarkMode ? "border-[#1f1f1f]" : "border-zinc-200")}>
            <div className="flex items-center gap-3 px-4 py-2 mb-4">
              <img 
                src={user.photoURL || "https://picsum.photos/seed/user/100"} 
                className="w-8 h-8 rounded-full border border-zinc-800"
                alt="Profile"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate text-[#e5e5e5]">{user.displayName}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{user.email ? 'Plano Premium' : 'Free'}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className={cn(
          "h-20 border-b flex items-center justify-between px-4 md:px-8 backdrop-blur-md sticky top-0 z-30 transition-colors duration-300",
          isDarkMode ? "bg-black/30 border-[#1f1f1f]" : "bg-white/70 border-zinc-200"
        )}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white p-2"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex flex-col">
              <h1 className="text-sm md:text-xl font-bold text-white truncate max-w-[120px] md:max-w-none">Olá, {user.displayName?.split(' ')[0]} 👋</h1>
              <p className="text-[10px] md:text-xs text-zinc-500 hidden sm:block">Confira o resumo da sua barbearia hoje.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-[#1f1f1f] hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-500"
              title={isDarkMode ? "Clarear Tema" : "Escurecer Tema"}
            >
              {isDarkMode ? <Sun size={20} className="text-gold" /> : <Moon size={20} className="text-zinc-600" />}
            </button>

            <button 
              onClick={() => setCurrentView('servicos')} 
              className="px-3 md:px-4 py-2 gold-gradient text-black rounded-lg text-xs font-black shadow-lg shadow-yellow-900/10 active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Serviço</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <Dashboard uid={user.uid} onNavigate={setCurrentView} />}
              {currentView === 'clientes' && <Clients uid={user.uid} />}
              {currentView === 'servicos' && <Services uid={user.uid} />}
              {currentView === 'produtos' && <Products uid={user.uid} />}
              {currentView === 'agendamentos' && <Appointments uid={user.uid} />}
              {currentView === 'financeiro' && <Finance uid={user.uid} />}
              {currentView === 'relatorios' && <Reports uid={user.uid} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <PwaInstallBanner />
    </div>
  );
}
