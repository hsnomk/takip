import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Package, ClipboardList, LogOut, Plus, Minus, Trash2,
  CheckCircle, Loader2, UserCircle, Edit3, Save, X, Search, Palette
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CustomerPanel() {
  const { user, setUser, setScreen, setUserType, darkMode, showAlert, refreshTrigger } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'orders' | 'profile'>('catalog');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<{ product_id: number; name: string; unit: string; quantity: number; note: string; variant_code?: string; variant_name?: string; variant_image_url?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<number, any>>({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>({});

  const fetchData = useCallback(async () => {
    if (!user?.wholesaler_code) return;
    setLoading(true);
    try {
      const [
        { data: prodData }, { data: orderData }, { data: itemsData }, { data: varData }
      ] = await Promise.all([
        supabase.from('products').select('*').eq('wholesaler_code', user.wholesaler_code).eq('status', 'active').order('id'),
        supabase.from('orders').select('*').eq('customer_id', user.id).order('id', { ascending: false }),
        supabase.from('order_items').select('*').order('id'),
        supabase.from('product_variants').select('*').order('id'),
      ]);
      setProducts(prodData || []);
      setOrders(orderData || []);
      setOrderItems(itemsData || []);
      setProductVariants(varData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.wholesaler_code, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);
  useEffect(() => { if (user) setProfileData({ ...user }); }, [user]);

  const getProductVariants = (productId: number) => productVariants.filter(v => v.product_id === productId);

  const addToCart = (product: any, qty: number, variant?: any) => {
    if (qty <= 0) return;
    const variants = getProductVariants(product.id);
    if (variants.length > 0 && !variant) { showAlert('Lütfen bir renk/varyant seçin', 'error'); return; }
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id && c.variant_code === variant?.variant_code);
      if (existing) return prev.map(c => (c.product_id === product.id && c.variant_code === variant?.variant_code) ? { ...c, quantity: qty } : c);
      return [...prev, { product_id: product.id, name: product.name, unit: product.unit, quantity: qty, note: product.note || '', variant_code: variant?.variant_code, variant_name: variant?.variant_name, variant_image_url: variant?.image_url }];
    });
    showAlert('Sepete eklendi', 'success');
  };

  const removeFromCart = (productId: number, variantCode?: string) => {
    setCart(prev => prev.filter(c => !(c.product_id === productId && c.variant_code === variantCode)));
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) { showAlert('Sepetiniz boş', 'error'); return; }
    try {
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        customer_id: user.id,
        customer_name: user.store_name,
        wholesaler_code: user.wholesaler_code,
        status: 'Yeni',
        total_items: cart.length,
      }).select().single();
      if (orderError) throw orderError;

      const orderItems = cart.map(c => ({
        order_id: orderData.id,
        product_id: c.product_id,
        product_name: c.name,
        quantity: c.quantity,
        unit: c.unit,
        checked: false,
        variant_code: c.variant_code || null,
        variant_name: c.variant_name || null,
        variant_image_url: c.variant_image_url || null,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      setCart([]); setQuantities({}); setSelectedVariants({});
      showAlert('Siparişiniz alındı!', 'success');
      fetchData(); setActiveTab('orders');
    } catch (err: any) { showAlert(err.message || 'Sipariş oluşturulamadı', 'error'); }
  };

  const handleSaveProfile = async () => {
    try {
      const { id, ...updates } = profileData;
      const { data, error } = await supabase.from('customers').update(updates).eq('id', user.id).select().single();
      if (error) throw error;
      setUser(data); setEditingProfile(false);
      showAlert('Profil güncellendi', 'success');
    } catch (err: any) { showAlert(err.message || 'Güncelleme başarısız', 'error'); }
  };

  const getOrderItems = (orderId: number) => orderItems.filter(oi => oi.order_id === orderId);
  const filteredProducts = products.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase()));

  const cardClass = `rounded-2xl p-6 transition-all ${darkMode ? 'bg-[#111827] border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${darkMode ? 'bg-[#1e293b] border-slate-600 text-white placeholder-slate-400 focus:border-[#0066FF]' : 'bg-white border-slate-200 text-[#0F172A] placeholder-slate-400 focus:border-[#0066FF]'}`;
  const displayClass = `px-4 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-[#1e293b] text-white border border-slate-700' : 'bg-slate-100 text-[#0F172A]'}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#090D16] text-[#F9FAFB]' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
      <header className={`sticky top-0 z-30 border-b ${darkMode ? 'bg-[#090D16]/90 border-slate-800' : 'bg-[#F8FAFC]/90 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Takip<span className="text-[#0066FF]">.</span> <span className="text-sm font-normal text-slate-400">Müşteri Paneli</span></h1>
          <button onClick={() => { setUser(null); setUserType(''); setScreen('landing'); }} className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-[#EF4444] transition-colors flex items-center gap-2">
            <LogOut size={14} />Çıkış Yap
          </button>
        </div>
      </header>

      <div className={`sticky top-[65px] z-20 border-b ${darkMode ? 'bg-[#090D16]/90 border-slate-800' : 'bg-[#F8FAFC]/90 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-1 overflow-x-auto">
          {[
            { key: 'catalog', label: 'Ürünler', icon: <Package size={14} /> },
            { key: 'cart', label: `Sepetim (${cart.length})`, icon: <ShoppingCart size={14} /> },
            { key: 'orders', label: 'Siparişlerim', icon: <ClipboardList size={14} /> },
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
          {activeTab === 'catalog' && (
            <motion.div key="catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inputClass} pl-9`} placeholder="Ürün veya kategori ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>
              {loading ? <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#0066FF]" /></div> : filteredProducts.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">Ürün bulunamadı.</div> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(p => {
                    const qty = quantities[p.id] ?? 0;
                    const variants = getProductVariants(p.id);
                    const selectedVariant = selectedVariants[p.id];
                    const displayImage = selectedVariant?.image_url || p.image_url;
                    return (
                      <div key={p.id} className={`rounded-2xl overflow-hidden border transition-all ${darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <img src={displayImage} alt={p.name} className="w-full h-40 object-cover" />
                        <div className="p-4">
                          <h3 className="font-medium text-sm mb-1">{p.name}</h3>
                          <p className="text-xs text-slate-400 mb-1">{p.category} · {p.unit}</p>
                          {p.note && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.note}</p>}
                          {variants.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1"><Palette size={10} /> Renk Seçin</p>
                              <div className="flex flex-wrap gap-1.5">
                                {variants.map(v => (
                                  <button key={v.id} onClick={() => setSelectedVariants(prev => ({ ...prev, [p.id]: v }))} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${selectedVariant?.id === v.id ? 'bg-[#0066FF] text-white border-[#0066FF]' : darkMode ? 'bg-[#1e293b] text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                    {v.variant_code}
                                  </button>
                                ))}
                              </div>
                              {selectedVariant && <p className="text-[10px] text-[#0066FF] mt-1">Seçilen: {selectedVariant.variant_name} (Kod: {selectedVariant.variant_code})</p>}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button onClick={() => setQuantities(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] ?? 0) - 1) }))} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Minus size={14} /></button>
                            <input type="number" min="0" value={qty} onChange={e => setQuantities(prev => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))} className="w-14 text-center px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" />
                            <button onClick={() => setQuantities(prev => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }))} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Plus size={14} /></button>
                          </div>
                          <button onClick={() => addToCart(p, qty, selectedVariant)} className="w-full mt-3 py-2 bg-[#0066FF] text-white rounded-xl text-xs font-medium hover:bg-blue-600 transition-all">Sepete Ekle</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={18} className="text-[#0066FF]" /> Sepetim</h2>
                {cart.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">Sepetiniz boş. Ürünler sekmesinden ürün ekleyin.</div> : (
                  <>
                    <div className="space-y-3 mb-6">
                      {cart.map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-[#0f1520]' : 'bg-slate-50'}`}>
                          {item.variant_image_url ? <img src={item.variant_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.variant_name && <p className="text-xs text-[#0066FF]">{item.variant_name} (Kod: {item.variant_code})</p>}
                            <p className="text-xs text-slate-400">{item.quantity} {item.unit}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.product_id, item.variant_code)} className="p-2 text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleConfirmOrder} className="w-full py-3 bg-[#10B981] text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> Siparişi Onayla
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ClipboardList size={18} className="text-[#0066FF]" /> Siparişlerim</h2>
                {orders.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Henüz sipariş vermediniz.</div> : (
                  <div className="space-y-4">
                    {orders.map(o => {
                      const items = getOrderItems(o.id);
                      const statusColor = o.status === 'Hazır' ? 'border-emerald-500' : o.status === 'Hazırlanıyor' ? 'border-orange-400' : o.status === 'Beklemede' ? 'border-[#F97316]' : o.status === 'İptal Edildi' ? 'border-red-400' : 'border-slate-300';
                      return (
                        <div key={o.id} className={`rounded-xl p-5 border-l-4 ${statusColor} ${darkMode ? 'bg-[#0f1520]' : 'bg-slate-50'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('tr-TR')}</p>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${o.status === 'Hazır' ? 'bg-emerald-100 text-emerald-700' : o.status === 'Hazırlanıyor' ? 'bg-orange-100 text-orange-700' : o.status === 'Beklemede' ? 'bg-amber-100 text-amber-700' : o.status === 'İptal Edildi' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                          </div>
                          <div className="space-y-2">
                            {items.map(it => (
                              <div key={it.id} className="flex items-center gap-3">
                                {it.variant_image_url ? <img src={it.variant_image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">{it.product_name}{it.variant_code ? ` — Renk ${it.variant_code}` : ''}</span>
                                    <span className="font-medium">{it.quantity} {it.unit}</span>
                                  </div>
                                  {it.variant_name && <p className="text-[10px] text-[#0066FF]">{it.variant_name}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  {[{ key: 'store_name', label: 'Mağaza Adı' }, { key: 'phone', label: 'Telefon' }].map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
                      {editingProfile ? <input className={inputClass} value={profileData[field.key] || ''} onChange={e => setProfileData({ ...profileData, [field.key]: e.target.value })} /> : <div className={displayClass}>{user?.[field.key] || '-'}</div>}
                    </div>
                  ))}
                  <div><label className="text-xs text-slate-400 mb-1 block">Toptancı Kodu</label><div className="px-4 py-2.5 rounded-xl bg-[#0066FF]/10 text-[#0066FF] text-sm font-mono font-medium">{user?.wholesaler_code}</div></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
