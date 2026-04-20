import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Package, Edit2, Trash2, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ProductsProps {
  uid: string;
}

export default function Products({ uid }: ProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', price: '', stock: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, `users/${uid}/produtos`), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock),
        updatedAt: Timestamp.now()
      };

      if (editingId) {
        await updateDoc(doc(db, `users/${uid}/produtos`, editingId), data);
      } else {
        await addDoc(collection(db, `users/${uid}/produtos`), {
          ...data,
          createdAt: Timestamp.now()
        });
      }
      setIsModalOpen(false);
      setFormData({ name: '', price: '', stock: '' });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({ name: product.name, price: product.price.toString(), stock: product.stock?.toString() || '0' });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDoc(doc(db, `users/${uid}/produtos`, deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="card-bg w-full max-w-xs p-6 rounded-2xl relative z-10 gold-border text-center">
              <div className="bg-red-500/10 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Excluir Produto?</h3>
              <p className="text-zinc-500 text-sm mb-6">O produto será removido permanentemente da sua vitrine.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary py-2 text-sm">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 btn-primary bg-red-600 hover:bg-red-700 py-2 text-sm border-none text-white">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vitrine de Produtos</h1>
          <p className="text-zinc-500">Gerencie seu estoque e produtos para venda.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', price: '', stock: '0' }); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <motion.div 
            layout
            key={product.id} 
            className="card-bg p-6 rounded-2xl flex flex-col items-center text-center relative group hover:border-gold/50 transition-all"
          >
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(product); }} 
                className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-gold/50 transition-all shadow-xl"
                title="Editar"
              >
                <Edit2 size={16}/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setDeleteId(product.id); }} 
                className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-all shadow-xl"
                title="Excluir"
              >
                <Trash2 size={16}/>
              </button>
            </div>

            <div className="bg-zinc-900 p-4 rounded-2xl text-gold mb-6 border border-zinc-800">
              <Package size={28} />
            </div>
            
            <h3 className="text-lg font-bold mb-2">{product.name}</h3>
            
            <div className="flex flex-col gap-1 mb-6 text-zinc-400 text-sm">
              <div className="flex items-center justify-center gap-2">
                <ShoppingBag size={12} className="text-gold" />
                Estoque: <span className={cn(product.stock <= 5 ? "text-red-400 font-bold" : "text-emerald-400")}>{product.stock} un</span>
              </div>
            </div>

            <div className="text-2xl font-black gold-text">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </motion.div>
        ))}
        {products.length === 0 && (
          <div className="lg:col-span-4 p-12 text-center text-zinc-600 italic">Nenhum produto cadastrado.</div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="card-bg w-full max-w-sm p-8 rounded-2xl relative z-10 gold-border">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Produto</label>
                  <input required className="w-full input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Pomada Modeladora" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço de Venda</label>
                    <input type="number" step="0.01" required className="w-full input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Qtd Estoque</label>
                    <input type="number" required className="w-full input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full btn-primary py-4 font-bold text-lg uppercase shadow-xl shadow-yellow-900/10">
                  {loading ? 'Salvando...' : 'Confirmar Produto'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
