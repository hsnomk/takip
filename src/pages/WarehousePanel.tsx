import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, PauseCircle, CheckCircle, LogOut, Loader2,
  UserCircle, Edit3, Save, X, PackageCheck, AlertCircle, Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function WarehousePanel() {
  const { user, setUser, setScreen, setUserType, darkMode, showAlert, refreshTrigger } = useApp();

  const [activeTab, setActiveTab] = useState<'incoming' | 'hold' | 'ready' | 'profile'>('incoming');
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: orderData }, { data: itemsData }] = await Promise.all([
        supabase.from('orders').select('*').order('id', { ascending: false }),
        supabase.from('order_items').select('*').order('id'),
      ]);
      setOrders(orderData || []);
      setOrderItems(itemsData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);
  useEffect(() => { if (user) setProfileData({ ...user }); }, [user]);

  const getOrderItems = (orderId: number) => orderItems.filter(oi => oi.order_id === orderId);

  const handleToggleItem = async (itemId: number, checked: boolean) => {
    try {
      const { error } = await supabase.from('order_items').update({ checked: !checked }).eq('id', itemId);
      if (error) throw error;

      const item = orderItems.find(oi => oi.id === itemId);
      if (item) {
        const items = getOrderItems(item.order_id);
        const updatedItems = items.map(i => i.id === itemId ? { ...i, checked: !checked } : i);
        const allChecked = updatedItems.every(i => i.checked);
        const someChecked = updatedItems.some(i => i.checked);
        let newStatus = 'Yeni';
        if (allChecked) newStatus = 'Hazır';
        else if (someChecked) newStatus = 'Hazırlanıyor';
        await supabase.from('orders').update({ status: newStatus }).eq('id', item.order_id);
      }
      fetchData();
    } catch (err: any) { showAlert(err.message || 'İşlem başarısız', 'error'); }
  };

  const handleHoldOrder = async (orderId: number) => {
    try {
      const { error } = await supabase.from('orders').update({ status: 'Beklemede' }).eq('id', orderId);
      if (error) throw error;
      showAlert('Sipariş beklemede', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'İşlem başarısız', 'error'); }
  };

  const handleConfirmOrder = async (orderId: number) => {
    const items = getOrderItems(orderId);
    if (!items.every(i => i.checked)) { showAlert('Tüm ürünler işaretlendikten sonra onaylayabilirsiniz', 'error'); return; }
    try {
      const { error } = await supabase.from('orders').update({ status: 'Hazır' }).eq('id', orderId);
      if (error) throw error;
      showAlert('Sipariş hazırlandı!', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'İşlem başarısız', 'error'); }
  };

  const handleSaveProfile = async () => {
    try {
      const { id, ...updates } = profileData;
      const { data, error } = await supabase.from('warehouse_staff').update(updates).eq('id', user.id).select().single();
      if (error) throw error;
      setUser(data); setEditingProfile(false);
      showAlert('Profil güncellendi', 'success');
    } catch (err: any) { showAlert(err.message || 'Güncelleme başarısız', 'error'); }
  };

  const incomingOrders = orders.filter(o => o.status !== 'Beklemede' && o.status !== 'İptal Edildi' && o.status !== 'Hazır');
  const holdOrders = orders.filter(o => o.status === 'Beklemede');
  const readyOrders = orders.filter(o => o.status === 'Hazır');

  const cardClass = `rounded-2xl p-6 transition-all ${darkMode ? 'bg-[#111827] border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${darkMode ? 'bg-[#1e293b] border-slate-600 text-white placeholder-slate-400 focus:border-[#0066FF]' : 'bg-white border-slate-200 text-[#0F172A] placeholder-slate-400 focus:border-[#0066FF]'}`;
  const displayClass = `px-4 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-[#1e293b] text-white border border-slate-700' : 'bg-slate-100 text-[#0F172A]'}`;

  const renderOrderCard = (order: any) => {
    const items = getOrderItems(order.id);
    const allChecked = items.length > 0 && items.every(i => i.checked);
    const someChecked = items.some(i => i.checked);
    const borderColor = order.status === 'Hazır' ? 'border-emerald-500' : someChecked ? 'border-orange-400' : 'border-slate-300';
    return (
      <div key={order.id} className={`rounded-xl p-5 border-l-4 ${borderColor} ${darkMode ? 'bg-[#0f1520]' : 'bg-slate-50'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">{order.customer_name}</h3>
            <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('tr-TR')} · {items.length} ürün</p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${order.status === 'Hazır' ? 'bg-emerald-100 text-emerald-700' : order.status === 'Hazırlanıyor' ? 'bg-orange-100 text-orange-700' : order.status === 'Beklemede' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
        </div>
        <div className="space-y-2 mb-4">
          {items.map(item => (
            <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input type="checkbox" checked={item.checked} onChange={() => handleToggleItem(item.id, item.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]" />
              {item.variant_image_url ? <img src={item.variant_image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <span className={`text-sm block ${item.checked ? 'line-through text-slate-400' : ''}`}>{item.product_name}</span>
                {item.variant_code && <span className="text-[10px] text-[#0066FF]">{item.variant_name} — Kod: {item.variant_code}</span>}
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{item.quantity} {item.unit}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {order.status !== 'Beklemede' && order.status !== 'Hazır' && (
            <>
              <button onClick={() => handleHoldOrder(order.id)} className="px-3 py-2 bg-[#F97316] text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-all flex items-center gap-1.5"><PauseCircle size={12} /> Beklemeye Al</button>
              <button onClick={() => handleConfirmOrder(order.id)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${allChecked ? 'bg-[#10B981] text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} disabled={!allChecked}><PackageCheck size={12} /> Siparişi Onayla</button>
            </>
          )}
          {order.status === 'Beklemede' && <div className="flex items-center gap-2 text-amber-500 text-xs"><AlertCircle size={14} /> Bu sipariş beklemede</div>}
          {order.status === 'Hazır' && <div className="flex items-center gap-2 text-emerald-500 text-xs"><CheckCircle size={14} /> Sipariş hazırlandı</div>}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#090D16] text-[#F9FAFB]' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
      <header className={`sticky top-0 z-30 border-b ${darkMode ? 'bg-[#090D16]/90 border-slate-800' : 'bg-[#F8FAFC]/90 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Takip<span className="text-[#0066FF]">.</span> <span className="text-sm font-normal text-slate-400">Depo Paneli</span></h1>
          <button onClick={() => { setUser(null); setUserType(''); setScreen('landing'); }} className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-[#EF4444] transition-colors flex items-center gap-2">
            <LogOut size={14} />Çıkış Yap
          </button>
        </div>
      </header>

      <div className={`sticky top-[65px] z-20 border-b ${darkMode ? 'bg-[#090D16]/90 border-slate-800' : 'bg-[#F8FAFC]/90 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-1 overflow-x-auto">
          {[
            { key: 'incoming', label: 'Gelen Siparişler', icon: <ClipboardList size={14} /> },
            { key: 'hold', label: 'Beklemede Olanlar', icon: <PauseCircle size={14} /> },
            { key: 'ready', label: 'Hazır', icon: <Package size={14} /> },
            { key: 'profile', label: 'Profilim', icon: <UserCircle size={14} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === t.key ? 'bg-[#0066FF] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'incoming' && (
            <motion.div key="incoming" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ClipboardList size={18} className="text-[#0066FF]" /> Gelen Siparişler</h2>
                {loading ? <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#0066FF]" /></div> : incomingOrders.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Gelen sipariş bulunamadı.</div> : <div className="space-y-4">{incomingOrders.map(renderOrderCard)}</div>}
              </div>
            </motion.div>
          )}
          {activeTab === 'hold' && (
            <motion.div key="hold" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><PauseCircle size={18} className="text-[#F97316]" /> Beklemede Olanlar</h2>
                {holdOrders.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Beklemede sipariş bulunamadı.</div> : <div className="space-y-4">{holdOrders.map(renderOrderCard)}</div>}
              </div>
            </motion.div>
          )}
          {activeTab === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={18} className="text-[#10B981]" /> Hazır Olan Siparişler</h2>
                {readyOrders.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Hazır sipariş bulunamadı.</div> : <div className="space-y-4">{readyOrders.map(renderOrderCard)}</div>}
              </div>
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><UserCircle size={18} className="text-[#0066FF]" /> Profil Bilgilerim</h2>
                  {!editingProfile ? <button onClick={() => setEditingProfile(true)} className="px-3 py-2 bg-[#0066FF] text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-all flex items-center gap-1.5"><Edit3 size={12} /> Düzenle</button> : (
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveProfile} className="px-3 py-2 bg-[#10B981] text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-all flex items-center gap-1.5"><Save size={12} /> Kaydet</button>
                      <button onClick={() => { setEditingProfile(false); setProfileData({ ...user }); }} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-1.5"><X size={12} /> İptal</button>
                    </div>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">İsim Soyisim</label>
                    {editingProfile ? <input className={inputClass} value={profileData.full_name || ''} onChange={e => setProfileData({ ...profileData, full_name: e.target.value })} /> : <div className={displayClass}>{user?.full_name || '-'}</div>}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Depocu Kodu</label>
                    <div className="px-4 py-2.5 rounded-xl bg-[#0066FF]/10 text-[#0066FF] text-sm font-mono font-medium">{user?.code}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
