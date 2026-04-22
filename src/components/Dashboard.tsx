import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeDate } from '../lib/dateUtils';
import { 
  TrendingUp, 
  DollarSign, 
  CalendarDays,
  Plus,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  subDays, 
  subMonths, 
  subWeeks, 
  isSameDay 
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DashboardProps {
  uid: string;
  onNavigate?: (view: any) => void;
}

export default function Dashboard({ uid, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    day: 0,
    week: 0,
    month: 0,
    appointments: 0,
    profit: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [nextAppointments, setNextAppointments] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [chartFilter, setChartFilter] = useState('7days');
  const [allFinanceData, setAllFinanceData] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;

    // 1. User Profile / Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile({ revenue_goal: 5000 });
      }
    });

    // 2. Next Appointments
    const nextAppQuery = query(
      collection(db, `users/${uid}/agendamentos`),
      orderBy('date', 'asc')
    );
    
    const unsubscribeNextApp = onSnapshot(nextAppQuery, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter future appointments and pending status manually to avoid composite index requirements
      const now = new Date();
      const futureApps = apps.filter((a: any) => {
        const d = safeDate(a.date);
        return d >= now && (a.status === 'pending' || !a.status);
      });
      setNextAppointments(futureApps.slice(0, 5));
    });

    // 3. Stats & Chart
    const financeQuery = collection(db, `users/${uid}/financeiro`);
    const unsubscribeFinance = onSnapshot(financeQuery, (snapshot) => {
      const finData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllFinanceData(finData);
    });

    // 4. Completed Appointments count
    const completedAppsQuery = query(
      collection(db, `users/${uid}/agendamentos`),
      where('status', '==', 'concluido')
    );
    const unsubscribeCompleted = onSnapshot(completedAppsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, appointments: snapshot.size }));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeNextApp();
      unsubscribeFinance();
      unsubscribeCompleted();
    };
  }, [uid]);

  useEffect(() => {
    if (!allFinanceData.length) return;

    const now = new Date();
    const todayInterval = { start: startOfDay(now), end: endOfDay(now) };
    const weekInterval = { start: startOfWeek(now), end: endOfWeek(now) };
    const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

    let dTotal = 0;
    let wTotal = 0;
    let mTotal = 0;
    let totalIn = 0;
    let totalOut = 0;

    // Filters for chart
    let chartStart = subDays(now, 6);
    let chartEnd = now;

    switch (chartFilter) {
      case 'today':
        chartStart = startOfDay(now);
        chartEnd = endOfDay(now);
        break;
      case 'yesterday':
        chartStart = startOfDay(subDays(now, 1));
        chartEnd = endOfDay(subDays(now, 1));
        break;
      case 'today_yesterday':
        chartStart = startOfDay(subDays(now, 1));
        chartEnd = endOfDay(now);
        break;
      case '7days':
        chartStart = subDays(now, 6);
        chartEnd = now;
        break;
      case '14days':
        chartStart = subDays(now, 13);
        chartEnd = now;
        break;
      case '28days':
        chartStart = subDays(now, 27);
        chartEnd = now;
        break;
      case '30days':
        chartStart = subDays(now, 29);
        chartEnd = now;
        break;
      case 'this_week':
        chartStart = startOfWeek(now, { weekStartsOn: 1 });
        chartEnd = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'last_week':
        chartStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        chartEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'this_month':
        chartStart = startOfMonth(now);
        chartEnd = endOfMonth(now);
        break;
      case 'last_month':
        chartStart = startOfMonth(subMonths(now, 1));
        chartEnd = endOfMonth(subMonths(now, 1));
        break;
      case 'max':
        chartStart = new Date(0);
        chartEnd = now;
        break;
    }

    const dailyData: Record<string, number> = {};

    allFinanceData.forEach((entry: any) => {
      const date = safeDate(entry.date);
      const amount = Number(entry.amount);

      // Global stats
      if (isWithinInterval(date, todayInterval)) if (entry.type === 'entrada') dTotal += amount;
      if (isWithinInterval(date, weekInterval)) if (entry.type === 'entrada') wTotal += amount;
      if (isWithinInterval(date, monthInterval)) if (entry.type === 'entrada') mTotal += amount;

      if (entry.type === 'entrada') totalIn += amount;
      if (entry.type === 'saida') totalOut += amount;

      // Chart data
      if (isWithinInterval(date, { start: startOfDay(chartStart), end: endOfDay(chartEnd) })) {
        const dayLabel = format(date, 'dd/MM');
        dailyData[dayLabel] = (dailyData[dayLabel] || 0) + (entry.type === 'entrada' ? amount : -amount);
      }
    });

    setStats(prev => ({
      ...prev,
      day: dTotal,
      week: wTotal,
      month: mTotal,
      profit: totalIn - totalOut
    }));

    const chart = Object.entries(dailyData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const [dayA, monthA] = a.name.split('/').map(Number);
        const [dayB, monthB] = b.name.split('/').map(Number);
        return (monthA * 100 + dayA) - (monthB * 100 + dayB);
      });
    
    setChartData(chart);
  }, [allFinanceData, chartFilter]);

  const handleUpdateGoal = async () => {
    try {
      const g = Number(newGoal);
      if (isNaN(g)) return;
      await setDoc(doc(db, 'users', uid), { 
        revenue_goal: g,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setIsEditingGoal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const revenueGoal = userProfile?.revenue_goal || 5000;
  const progressPercent = Math.min((stats.month / revenueGoal) * 100, 100);

  const cards = [
    { title: 'Faturamento Hoje', value: stats.day, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '↑ 12% vs ontem' },
    { title: 'Atendimentos', value: stats.appointments.toString(), icon: TrendingUp, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', trend: `${nextAppointments.length} agendados` },
    { title: 'Lucro Estimado', value: `R$ ${stats.profit.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', trend: 'Margem Líquida' },
    { title: 'Meta do Mês', value: `${progressPercent.toFixed(0)}%`, icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: `Falta R$ ${(revenueGoal - stats.month).toLocaleString('pt-BR')}` },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={card.title} 
            className="card-bg p-5 rounded-2xl stat-card group relative overflow-hidden"
          >
            {card.title === 'Meta do Mês' && (
              <button 
                onClick={() => { setNewGoal(revenueGoal.toString()); setIsEditingGoal(true); }}
                className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-gold transition-colors"
                title="Editar Meta"
              >
                <Plus size={14} />
              </button>
            )}

            <p className="text-zinc-500 text-sm mb-1">{card.title}</p>
            <h3 className={cn("text-2xl font-bold mb-1 transition-colors", (card.title === 'Lucro Estimado' || card.title === 'Meta do Mês') && "gold-text")}>
              {card.title === 'Meta do Mês' ? `${progressPercent.toFixed(0)}%` : (typeof card.value === 'number' ? `R$ ${card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : card.value)}
            </h3>
            {card.title === 'Meta do Mês' ? (
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3">
                <div className="gold-gradient h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            ) : (
              <span className={cn("text-xs font-medium", card.color)}>{card.trend}</span>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isEditingGoal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsEditingGoal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="card-bg w-full max-w-xs p-6 rounded-2xl relative z-10 gold-border">
              <h3 className="text-lg font-bold mb-4">Meta Mensal (R$)</h3>
              <input 
                type="number" 
                className="w-full input-field mb-4" 
                value={newGoal} 
                onChange={e => setNewGoal(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setIsEditingGoal(false)} className="flex-1 btn-secondary py-2 text-sm">Cancelar</button>
                <button onClick={handleUpdateGoal} className="flex-1 btn-primary py-2 text-sm">Salvar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-bg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white">Desempenho Financeiro</h3>
            <select 
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
              className="bg-zinc-900 text-xs border border-zinc-800 rounded px-2 py-1 outline-none text-zinc-400 cursor-pointer hover:border-gold/50 transition-colors"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="today_yesterday">Hoje e ontem</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="14days">Últimos 14 dias</option>
              <option value="28days">Últimos 28 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="this_week">Esta semana</option>
              <option value="last_week">Semana passada</option>
              <option value="this_month">Este mês</option>
              <option value="last_month">Mês passado</option>
              <option value="max">Máximo</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px' }}
                  itemStyle={{ color: '#d4af37' }}
                  cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= 0 ? '#d4af37' : '#ef4444'} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
            {chartData.length > 7 ? (
              <span className="w-full text-center">Tendência do período selecionado</span>
            ) : (
              chartData.map(d => <span key={d.name}>{d.name}</span>)
            )}
          </div>
        </div>

        <div className="card-bg rounded-2xl p-6 flex flex-col">
          <h3 className="font-bold mb-6 text-white text-lg">Próximos Clientes</h3>
          <div className="space-y-4 flex-1">
            {nextAppointments.map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 group hover:border-[#d4af37]/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 capitalize">
                    {(app.clientName || app.client_name || 'C').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{app.clientName || app.client_name || 'Cliente'}</p>
                    <p className="text-[10px] text-zinc-500 italic">{app.serviceName || app.service_name || 'Serviço'}</p>
                  </div>
                </div>
                <span className="text-xs gold-text font-bold uppercase tracking-tighter">
                  {format(safeDate(app.date), 'HH:mm')}
                </span>
              </div>
            ))}

            {nextAppointments.length === 0 && (
              <div className="text-center p-8 text-zinc-600 italic text-sm">
                Nenhum agendamento pendente.
              </div>
            )}
          </div>
          
          <button 
            onClick={() => onNavigate?.('agendamentos')}
            className="w-full mt-6 py-4 text-xs font-bold text-zinc-500 hover:text-[#d4af37] transition-all uppercase tracking-widest border-t border-zinc-800 pt-4"
          >
            Ver agenda completa →
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-zinc-500 text-[10px] uppercase font-bold tracking-widest border-t border-zinc-900 pt-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full gold-gradient shadow-sm shadow-yellow-900/40"></div>
          <span>Assinatura Ativa (Pro)</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span>Sincronizado com Firestore</span>
        </div>
        <div className="text-right">v2.4.0 Stable Build</div>
      </div>
    </div>
  );
}
