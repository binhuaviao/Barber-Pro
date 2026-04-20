import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Search, User, Phone, Mail, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ClientsProps {
  uid: string;
}

export default function Clients({ uid }: ClientsProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, `users/${uid}/clientes`), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, `users/${uid}/clientes`, editingId), formData);
      } else {
        await addDoc(collection(db, `users/${uid}/clientes`), {
          ...formData,
          createdAt: Timestamp.now()
        });
      }
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', notes: '' });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    setFormData({ name: client.name, phone: client.phone || '', email: client.email || '', notes: client.notes || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteDoc(doc(db, `users/${uid}/clientes`, id));
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-zinc-500">Gerencie sua base de clientes e histórico.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', email: '', notes: '' }); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="flex gap-4 items-center glass-card px-4 py-2">
        <Search className="text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou telefone..."
          className="bg-transparent border-none focus:outline-none flex-1 py-2 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <motion.div 
            layout
            key={client.id} 
            className="glass-card p-6 flex flex-col group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-zinc-800 p-3 rounded-xl text-gold">
                <User size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(client)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(client.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-4">{client.name}</h3>
            
            <div className="space-y-3 flex-1">
              {client.phone && (
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <Phone size={14} className="text-gold" />
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <Mail size={14} className="text-gold" />
                  {client.email}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
              Cliente desde {format(client.createdAt?.toDate() || new Date(), 'MMM yyyy')}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md p-8 relative z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 font-medium">Nome Completo</label>
                  <input 
                    required
                    className="w-full input-field"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400 font-medium">Telefone</label>
                    <input 
                      className="w-full input-field"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400 font-medium">E-mail (opcional)</label>
                    <input 
                      type="email"
                      className="w-full input-field"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 font-medium">Observações</label>
                  <textarea 
                    className="w-full input-field min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Preferências, alergias, etc."
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full btn-primary py-3"
                >
                  {loading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
