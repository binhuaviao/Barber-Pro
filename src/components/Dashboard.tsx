import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DashboardProps {
  uid: string;
}

export default function Dashboard({ uid }: DashboardProps) {
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

  useEffect(() => {
    if (!uid) return;

    // Listen to user profile
    const unsubProfile = onSnapshot(doc(db, `users/${uid}`), (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data());
      }
    });

    // Listen to next appointments
    const qNext = query(
      collection(db, `users/${uid}/agendamentos`), 
      where('status', '==', 'pending'),
      where('date', '>=', Timestamp.now()),
      orderBy('date', 'asc')
    );
    const unsubNext = onSnapshot(qNext, (snap) => {
      setNextAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 3));
    });

    // Listen to financial entries to calculate stats
    const q = query(collection(db, `users/${uid}/financeiro`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const today = { start: startOfDay(now), end: endOfDay(now) };
      const week = { start: startOfWeek(now), end: endOfWeek(now) };
      const month = { start: startOfMonth(now), end: endOfMonth(now) };

      let dTotal = 0;
      let wTotal = 0;
      let mTotal = 0;
      let totalIn = 0;
      let totalOut = 0;

      const dailyData: Record<string, number> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.date.toDate();
        const amount = data.amount;

        if (isWithinInterval(date, today)) {
          if (data.type === 'entrada') dTotal += amount;
        }
        if (isWithinInterval(date, week)) {
          if (data.type === 'entrada') wTotal += amount;
        }
        if (isWithinInterval(date, month)) {
          if (data.type === 'entrada') mTotal += amount;
        }

        if (data.type === 'entrada') totalIn += amount;
        if (data.type === 'saida') totalOut += amount;

        // Group for chart (last 7 days)
        const dayLabel = format(date, 'dd/MM');
        dailyData[dayLabel] = (dailyData[dayLabel] || 0) + (data.type === 'entrada' ? amount : -amount);
      });

      setStats({
        day: dTotal,
        week: wTotal,
        month: mTotal,
        appointments: snapshot.size,
        profit: totalIn - totalOut
      });

      // Format chart data
      const last7Days = Object.entries(dailyData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(-7);
      setChartData(last7Days);
    });

    // Listen to appointments count
    const qApp = query(collection(db, `users/${uid}/agendamentos`), where('status', '==', 'concluido'));
    const unsubApp = onSnapshot(qApp, (snap) => {
      setStats(prev => ({ ...prev, appointments: snap.size }));
    });

    return () => {
      unsubscribe();
      unsubApp();
      unsubNext();
      unsubProfile();
    };
  }, [uid]);

  const handleUpdateGoal = async () => {
    try {
      const g = Number(newGoal);
      if (isNaN(g)) return;
      await updateDoc(doc(db, `users/${uid}`), {
        revenueGoal: g,
        updatedAt: Timestamp.now()
      });
      setIsEditingGoal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const revenueGoal = userProfile?.revenueGoal || 5000;
  const progressPercent = Math.min((stats.month / revenueGoal) * 100, 100);

  const cards = [
    { title: 'Faturamento Hoje', value: stats.day, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '↑ 12% vs ontem' },
    { title: 'Atendimentos', value: stats.appointments.toString(), icon: TrendingUp, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', trend: `${nextAppointments.length} agendados` },
    { title: 'Lucro Estimado', value: `R$ ${stats.profit.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', trend: 'Margem Líquida' },
    { title: 'Meta do Mês', value: `${progressPercent.toFixed(0)}%`, icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: `Falta R$ ${(revenueGoal - stats.month).toLocaleString('pt-BR')}` },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Support Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-bg p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 gold-border"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="font-bold text-white">Contribua com a evolução do BarberPro 🚀</h4>
            <p className="text-sm text-zinc-500">Seu apoio via Mercado Pago nos ajuda a lançar novas funcionalidades.</p>
          </div>
        </div>
        <a 
          href="https://mpago.la/1FTq8fL" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary flex items-center gap-2 px-8 group font-black"
        >
          Apoiar no Mercado Pago
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </a>
      </motion.div>

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
            <h3 className="font-bold text-white">Desempenho Semanal</h3>
            <select className="bg-zinc-900 text-xs border border-zinc-800 rounded px-2 py-1 outline-none text-zinc-400">
              <option>Últimos 7 dias</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: '12px' }}
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
            <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
          </div>
        </div>

        <div className="card-bg rounded-2xl p-6 flex flex-col">
          <h3 className="font-bold mb-6 text-white text-lg">Próximos Clientes</h3>
          <div className="space-y-4 flex-1">
            {nextAppointments.map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 group hover:border-[#d4af37]/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 capitalize">
                    {app.clientName?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{app.clientName}</p>
                    <p className="text-[10px] text-zinc-500 italic">{app.serviceName}</p>
                  </div>
                </div>
                <span className="text-xs gold-text font-bold uppercase tracking-tighter">
                  {format(app.date.toDate(), 'HH:mm')}
                </span>
              </div>
            ))}

            {nextAppointments.length === 0 && (
              <div className="text-center p-8 text-zinc-600 italic text-sm">
                Nenhum agendamento pendente.
              </div>
            )}
          </div>
          
          <button className="w-full mt-6 py-4 text-xs font-bold text-zinc-500 hover:text-[#d4af37] transition-all uppercase tracking-widest border-t border-zinc-800 pt-4">
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
