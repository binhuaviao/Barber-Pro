import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeDate } from '../lib/dateUtils';
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Scissors, 
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface AppointmentsProps {
  uid: string;
}

export default function Appointments({ uid }: AppointmentsProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    clientId: '', 
    serviceId: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    time: '09:00' 
  });

  useEffect(() => {
    if (!uid) return;

    // 1. Appointments
    const qApp = query(
      collection(db, `users/${uid}/agendamentos`),
      orderBy('date', 'desc')
    );
    const unsubscribeApp = onSnapshot(qApp, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    });

    // 2. Clients
    const qClients = query(collection(db, `users/${uid}/clientes`), orderBy('name', 'asc'));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Services
    const qServices = query(collection(db, `users/${uid}/servicos`), orderBy('name', 'asc'));
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeApp();
      unsubscribeClients();
      unsubscribeServices();
    };
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const service = services.find(s => s.id === formData.serviceId);
      
      const appointmentDate = new Date(`${formData.date}T${formData.time}:00`);

      await addDoc(collection(db, `users/${uid}/agendamentos`), {
        clientId: formData.clientId,
        clientName: client?.name || 'Cliente',
        serviceId: formData.serviceId,
        serviceName: service?.name || 'Serviço',
        price: Number(service?.price || 0),
        date: Timestamp.fromDate(appointmentDate),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setFormData({ 
        clientId: '', 
        serviceId: '', 
        date: format(new Date(), 'yyyy-MM-dd'), 
        time: '09:00' 
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao agendar');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, appointment: any) => {
    try {
      await updateDoc(doc(db, `users/${uid}/agendamentos`, id), { status });

      // If concluded, add financial record automatically
      if (status === 'concluido') {
        const cName = appointment.clientName || appointment.client_name || clients.find(c => c.id === appointment.clientId || c.id === appointment.client_id)?.name || 'Cliente';
        const sName = appointment.serviceName || appointment.service_name || services.find(s => s.id === appointment.serviceId || s.id === appointment.service_id)?.name || 'Serviço';

        await addDoc(collection(db, `users/${uid}/financeiro`), {
          type: 'entrada',
          category: 'Serviço Concluído',
          description: `${sName} - ${cName}`,
          amount: Number(appointment.price),
          date: serverTimestamp(),
          reference_id: id
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'cancelado': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gold bg-gold/10 border-gold/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Atendimentos</h1>
          <p className="text-zinc-500">Organize seus horários e acompanhe o status dos serviços.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Agendar Horário
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/30">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Data / Hora</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Cliente</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Serviço</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(app => (
                <tr key={app.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold whitespace-nowrap">
                      {format(safeDate(app.date), 'dd/MM/yyyy')}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Clock size={10} className="text-gold" />
                      {format(safeDate(app.date), 'HH:mm')}
                    </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-zinc-500" />
                      <span className="truncate max-w-[150px]">
                        {app.clientName || app.client_name || clients.find(c => c.id === app.clientId || c.id === app.client_id)?.name || 'Cliente'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Scissors size={14} className="text-zinc-500" />
                      <span className="truncate max-w-[150px]">
                        {app.serviceName || app.service_name || services.find(s => s.id === app.serviceId || s.id === app.service_id)?.name || 'Serviço'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gold">
                    R$ {app.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">
                    <div className={`mx-auto w-fit px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tighter ${getStatusColor(app.status)}`}>
                      {app.status === 'pending' ? 'PENDENTE' : app.status.toUpperCase()}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {app.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => updateStatus(app.id, 'concluido', app)}
                          className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                          title="Concluir"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => updateStatus(app.id, 'cancelado', app)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          title="Cancelar"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600">Finalizado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-zinc-800">
          {appointments.map(app => (
            <div key={app.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">
                    {format(safeDate(app.date), 'dd/MM/yyyy')}
                  </span>
                  <span className="text-sm text-zinc-400 flex items-center gap-1">
                    <Clock size={12} className="text-gold" />
                    {format(safeDate(app.date), 'HH:mm')}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tighter ${getStatusColor(app.status)}`}>
                  {app.status === 'pending' ? 'PENDENTE' : app.status.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cliente</p>
                  <p className="flex items-center gap-1">
                    <User size={12} className="text-zinc-500" />
                    {app.clientName || app.client_name || clients.find(c => c.id === app.clientId || c.id === app.client_id)?.name || 'Cliente'}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Serviço</p>
                  <p className="flex items-center gap-1 justify-end">
                    {app.serviceName || app.service_name || services.find(s => s.id === app.serviceId || s.id === app.service_id)?.name || 'Serviço'}
                    <Scissors size={12} className="text-zinc-500" />
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                <span className="font-bold text-gold">
                  R$ {app.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                
                {app.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateStatus(app.id, 'cancelado', app)}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold uppercase border border-red-500/20"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => updateStatus(app.id, 'concluido', app)}
                      className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold uppercase border border-green-500/20"
                    >
                      Concluir
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 font-bold uppercase">Finalizado</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {appointments.length === 0 && (
          <div className="p-12 text-center text-zinc-500 italic">Nenhum agendamento encontrado.</div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="glass-card w-full max-w-md p-8 relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Novo Agendamento</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cliente</label>
                  <select 
                    required 
                    className="w-full input-field pr-10 appearance-none bg-zinc-900"
                    value={formData.clientId}
                    onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Serviço</label>
                  <select 
                    required 
                    className="w-full input-field pr-10 appearance-none bg-zinc-900"
                    value={formData.serviceId}
                    onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - R${s.price}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data</label>
                    <input type="date" required className="w-full input-field h-12" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hora</label>
                    <input type="time" required className="w-full input-field h-12" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full btn-primary py-4 font-bold text-lg shadow-xl shadow-gold/20">
                  {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
