import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Scissors, Edit2, Trash2, X, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ServicesProps {
  uid: string;
}

export default function Services({ uid }: ServicesProps) {
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', price: '', duration: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, `users/${uid}/servicos`),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(data);
    }, (err) => {
      console.error(err);
      setError('Erro ao carregar serviços.');
    });

    return () => unsubscribe();
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        duration: Number(formData.duration),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, `users/${uid}/servicos`, editingId), payload);
      } else {
        await addDoc(collection(db, `users/${uid}/servicos`), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setFormData({ name: '', price: '', duration: '' });
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({ name: service.name, price: service.price.toString(), duration: service.duration?.toString() || '30' });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, `users/${uid}/servicos`, deleteId));
      } catch (err) {
        console.error(err);
        setError('Erro ao excluir serviço');
      }
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ... previous code ... */}
      
      {/* Custom Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="card-bg w-full max-w-xs p-6 rounded-2xl relative z-10 gold-border text-center">
              <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Excluir Serviço?</h3>
              <p className="text-zinc-500 text-sm mb-6">Esta ação não pode ser desfeita e o serviço será removido da lista.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary py-2 text-sm">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 btn-primary bg-red-600 hover:bg-red-700 py-2 text-sm border-none">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Arquitetura de Serviços</h1>
          <p className="text-zinc-500">Defina os serviços e precificação da sua barbearia.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', price: '0', duration: '30' }); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Serviço
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(service => (
          <motion.div 
            layout
            key={service.id} 
            className="card-bg p-6 rounded-2xl flex flex-col items-center text-center relative hover:border-gold/30 transition-all group"
          >
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(service); }} 
                className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-gold/50 transition-all shadow-xl"
                title="Editar"
              >
                <Edit2 size={16}/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setDeleteId(service.id); }} 
                className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-all shadow-xl"
                title="Excluir"
              >
                <Trash2 size={16}/>
              </button>
            </div>

            <div className="bg-zinc-800 p-4 rounded-2xl text-gold mb-6 border border-zinc-700">
              <Scissors size={28} />
            </div>
            
            <h3 className="text-lg font-bold mb-2">{service.name}</h3>
            
            <div className="flex flex-col gap-1 mb-6 text-zinc-400 text-sm">
              <div className="flex items-center justify-center gap-2">
                <Clock size={12} className="text-gold" />
                {service.duration} min
              </div>
            </div>

            <div className="text-2xl font-black text-gold">
              R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="glass-card w-full max-w-sm p-8 relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Serviço</label>
                  <input required className="w-full input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Corte Degradê" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço (R$)</label>
                    <input type="number" step="0.01" required className="w-full input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tempo (min)</label>
                    <input type="number" required className="w-full input-field" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full btn-primary py-4 font-bold text-lg uppercase tracking-tighter shadow-xl shadow-gold/20">
                  {loading ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
