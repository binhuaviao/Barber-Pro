import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileText, Download, Filter, TrendingUp, Award, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ReportsProps {
  uid: string;
}

export default function Reports({ uid }: ReportsProps) {
  const [data, setData] = useState<{
    totalRevenue: number;
    totalExpenses: number;
    serviceRanking: { name: string, count: number, revenue: number }[];
    monthlyData: { name: string, revenue: number }[];
  }>({
    totalRevenue: 0,
    totalExpenses: 0,
    serviceRanking: [],
    monthlyData: []
  });

  useEffect(() => {
    const fetchData = async () => {
      const finSnap = await getDocs(query(collection(db, `users/${uid}/financeiro`)));
      const appSnap = await getDocs(query(collection(db, `users/${uid}/agendamentos`), where('status', '==', 'concluido')));

      let revenue = 0;
      let expenses = 0;
      const rankingMap: Record<string, { count: number, revenue: number }> = {};

      finSnap.docs.forEach(d => {
        const item = d.data();
        if (item.type === 'entrada') revenue += item.amount;
        else expenses += item.amount;
      });

      appSnap.docs.forEach(d => {
        const item = d.data();
        const sName = item.serviceName || 'Outros';
        if (!rankingMap[sName]) rankingMap[sName] = { count: 0, revenue: 0 };
        rankingMap[sName].count += 1;
        rankingMap[sName].revenue += item.price;
      });

      const ranking = Object.entries(rankingMap)
        .map(([name, vals]) => ({ name, ...vals }))
        .sort((a, b) => b.revenue - a.revenue);

      setData({
        totalRevenue: revenue,
        totalExpenses: expenses,
        serviceRanking: ranking,
        monthlyData: [] // Would need more logic for multiple months
      });
    };

    fetchData();
  }, [uid]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios e Insights</h1>
          <p className="text-zinc-500">Análise profunda do seu negócio e metas.</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download size={18} />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <Award className="text-gold" size={20} />
            <h3 className="font-bold uppercase text-xs tracking-widest">Ranking de Serviços (Mais Vendidos)</h3>
          </div>
          <div className="p-6 space-y-4">
            {data.serviceRanking.map((s, idx) => (
              <div key={s.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-sm font-bold text-gold">R$ {s.revenue.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    <span>{s.count} Atendimentos</span>
                    <span>100% de Satisfação</span>
                  </div>
                </div>
              </div>
            ))}
            {data.serviceRanking.length === 0 && (
              <div className="p-12 text-center text-zinc-600 italic">Dados insuficientes para gerar ranking.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 bg-gold/5 border-gold/10">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-gold" size={24} />
              <h3 className="font-bold">Meta de Faturamento Mensal</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Status Atual</p>
                  <p className="text-3xl font-black text-white">R$ {data.totalRevenue.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Meta</p>
                   <p className="text-xl font-bold text-zinc-400">R$ 10.000,00</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((data.totalRevenue / 10000) * 100, 100)}%` }}
                    className="bg-gold h-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  />
                </div>
                <p className="text-xs text-center text-zinc-500">
                  Você atingiu <span className="text-gold font-bold">{Math.round((data.totalRevenue / 10000) * 100)}%</span> da sua meta este mês.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold">Eficiência Operacional</h3>
              <Clock className="text-zinc-600" size={18} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                 <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Ticket Médio</p>
                 <p className="text-xl font-bold">R$ {(data.totalRevenue / (data.serviceRanking.reduce((a, b) => a + b.count, 0) || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                 <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Margem Líquida</p>
                 <p className="text-xl font-bold">{Math.round(( (data.totalRevenue - data.totalExpenses) / (data.totalRevenue || 1)) * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
