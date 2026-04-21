import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeDate } from '../lib/dateUtils';
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Calendar, Filter, X, ShoppingBag, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface FinanceProps {
  uid: string;
}

export default function Finance({ uid }: FinanceProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    type: 'entrada', 
    amount: '', 
    description: '', 
    category: '', 
    date: format(new Date(), 'yyyy-MM-dd'),
    productId: '',
    quantity: '1'
  });

  useEffect(() => {
    if (!uid) return;

    // 1. Finance entries
    const qFin = query(
      collection(db, `users/${uid}/financeiro`),
      orderBy('date', 'desc')
    );
    const unsubscribeFin = onSnapshot(qFin, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntries(data);
    });

    // 2. Products
    const qProd = query(collection(db, `users/${uid}/produtos`), orderBy('name', 'asc'));
    const unsubscribeProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeFin();
      unsubscribeProd();
    };
  }, [uid]);

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId: product.id,
        amount: (product.price * Number(formData.quantity)).toString(),
        description: `Venda: ${product.name}`,
        category: 'Venda de Produto'
      });
    } else {
      setFormData({
        ...formData,
        productId: '',
        amount: '',
        description: '',
        category: ''
      });
    }
  };

  const handleQuantityChange = (qty: string) => {
    const numQty = Number(qty);
    const product = products.find(p => p.id === formData.productId);
    if (product) {
      setFormData({
        ...formData,
        quantity: qty,
        amount: (product.price * numQty).toString()
      });
    } else {
      setFormData({ ...formData, quantity: qty });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dateObj = new Date(formData.date + 'T12:00:00');

      // 1. Add financial entry
      await addDoc(collection(db, `users/${uid}/financeiro`), {
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category,
        date: Timestamp.fromDate(dateObj),
        reference_id: formData.productId || null,
        createdAt: serverTimestamp()
      });

      // 2. If it's a product sale, decrement stock
      if (formData.productId && formData.type === 'entrada') {
        const qty = Number(formData.quantity);
        const product = products.find(p => p.id === formData.productId);
        if (product) {
          await updateDoc(doc(db, `users/${uid}/produtos`, formData.productId), {
            stock: Number(product.stock) - qty
          });
        }
      }

      setIsModalOpen(false);
      setFormData({ 
        type: 'entrada', 
        amount: '', 
        description: '', 
        category: '', 
        date: format(new Date(), 'yyyy-MM-dd'),
        productId: '',
        quantity: '1'
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao registrar lançamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este lançamento?')) {
      try {
        await deleteDoc(doc(db, `users/${uid}/financeiro`, id));
      } catch (err) {
        console.error(err);
        setError('Erro ao excluir lançamento');
      }
    }
  };

  const totalIn = entries.reduce((acc, curr) => curr.type === 'entrada' ? acc + curr.amount : acc, 0);
  const totalOut = entries.reduce((acc, curr) => curr.type === 'saida' ? acc + curr.amount : acc, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão Financeira</h1>
          <p className="text-zinc-500">Controle total de entradas, saídas e fluxo de caixa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Lançamento
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-green-500">
          <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Entradas</p>
          <h3 className="text-2xl font-bold text-green-400 font-mono">R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="glass-card p-6 border-l-4 border-red-500">
          <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Saídas</p>
          <h3 className="text-2xl font-bold text-red-500 font-mono">R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="glass-card p-6 border-l-4 border-gold">
          <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Saldo Líquido</p>
          <h3 className="text-2xl font-bold text-gold font-mono">R$ {(totalIn - totalOut).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Histórico de Transações</h3>
          <div className="flex items-center gap-4">
            <button className="text-zinc-500 hover:text-white transition-colors"><Filter size={16}/></button>
          </div>
        </div>
        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-zinc-600 uppercase border-b border-zinc-800">
                <th className="p-4">Data</th>
                <th className="p-4">Descrição / Categoria</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Tipo</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 text-sm text-zinc-400">
                    {format(safeDate(entry.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{entry.description || 'Sem descrição'}</span>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">{entry.category || 'Geral'}</span>
                    </div>
                  </td>
                  <td className={entry.type === 'entrada' ? 'p-4 text-right font-mono font-bold text-green-400' : 'p-4 text-right font-mono font-bold text-red-400'}>
                    {entry.type === 'entrada' ? '+' : '-'} R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {entry.type === 'entrada' ? (
                        <ArrowUpCircle className="text-green-500" size={20} />
                      ) : (
                        <ArrowDownCircle className="text-red-500" size={20} />
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(entry.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-zinc-800">
          {entries.map(entry => (
            <div key={entry.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  entry.type === 'entrada' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                )}>
                  {entry.type === 'entrada' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm block truncate max-w-[120px]">{entry.description || 'Sem descrição'}</span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-2 font-bold uppercase">
                    {format(safeDate(entry.date), 'dd/MM/yyyy')}
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    {entry.category || 'Geral'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-mono font-bold text-sm",
                  entry.type === 'entrada' ? "text-green-400" : "text-red-400"
                )}>
                  {entry.type === 'entrada' ? '+' : '-'} R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button onClick={() => handleDelete(entry.id)} className="p-2 text-zinc-600 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {entries.length === 0 && (
          <div className="p-12 text-center text-zinc-600 italic">Nenhuma transação registrada.</div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="glass-card w-full max-w-md p-8 relative z-10">
               <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Lançamento Financeiro</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex p-1 bg-zinc-900 rounded-xl space-x-1">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'entrada'})}
                    className={formData.type === 'entrada' ? 'flex-1 py-3 bg-green-500 text-black font-bold rounded-lg transition-all' : 'flex-1 py-3 text-zinc-500 hover:text-white'}
                  >
                    Entrada
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'saida'})}
                    className={formData.type === 'saida' ? 'flex-1 py-3 bg-red-500 text-white font-bold rounded-lg transition-all' : 'flex-1 py-3 text-zinc-500 hover:text-white'}
                  >
                    Saída
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vincular Produto (Opcional)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select 
                          className="w-full input-field pr-10 appearance-none bg-zinc-900"
                          value={formData.productId}
                          onChange={e => handleProductSelect(e.target.value)}
                        >
                          <option value="">Selecione um produto</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (R$ {p.price.toLocaleString('pt-BR')}) - Est. {p.stock}
                            </option>
                          ))}
                        </select>
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-zinc-500">
                          <ShoppingBag size={14} />
                        </div>
                      </div>
                      <input 
                        type="number" 
                        min="1" 
                        disabled={!formData.productId}
                        className="w-20 input-field text-center" 
                        value={formData.quantity} 
                        onChange={e => handleQuantityChange(e.target.value)}
                        placeholder="Qtd"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor (R$)</label>
                    <input type="number" step="0.01" required className="w-full input-field text-2xl font-mono text-center h-16" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0,00" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descrição</label>
                    <input required className="w-full input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Pagamento Aluguel" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categoria</label>
                      <input className="w-full input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Operacional" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data</label>
                      <input type="date" required className="w-full input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className={formData.type === 'entrada' ? 'w-full py-4 bg-green-500 text-black font-bold uppercase rounded-xl transition-all' : 'w-full py-4 bg-red-500 text-white font-bold uppercase rounded-xl transition-all'}>
                  {loading ? 'Salvando...' : 'Registrar Lançamento'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
