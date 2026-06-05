import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Users, ClipboardList, LogOut, Search, Plus, Trash2, PauseCircle,
  CheckCircle, XCircle, Loader2, Edit3, Save, X,
  Boxes, UserCircle, ImageIcon, Store, Mail, Phone, Palette
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const units = ['Metre', 'Top', 'Koli', 'Kg', 'Adet'];

function generateCode(prefix: string) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function ManagerDashboard() {
  const { user, setUser, setScreen, setUserType, darkMode, showAlert, refreshTrigger } = useApp();

  const [activeSection, setActiveSection] = useState<'products' | 'staff' | 'customers' | 'orders' | 'profile'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pUnit, setPUnit] = useState('Metre');
  const [pNote, setPNote] = useState('');
  const [pImage, setPImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productTab, setProductTab] = useState<'active' | 'hold'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [variantModalProduct, setVariantModalProduct] = useState<any>(null);
  const [vCode, setVCode] = useState('');
  const [vName, setVName] = useState('');
  const [vImage, setVImage] = useState('');
  const [uploadingVImage, setUploadingVImage] = useState(false);
  const vFileInputRef = useRef<HTMLInputElement>(null);

  const [sName, setSName] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    if (!user?.code) return;
    setLoading(true);
    try {
      const [
        { data: prodData }, { data: staffData }, { data: custData },
        { data: orderData }, { data: itemsData }, { data: varData }
      ] = await Promise.all([
        supabase.from('products').select('*').eq('wholesaler_code', user.code).order('id'),
        supabase.from('warehouse_staff').select('*').order('id'),
        supabase.from('customers').select('*').eq('wholesaler_code', user.code).order('id'),
        supabase.from('orders').select('*').eq('wholesaler_code', user.code).order('id', { ascending: false }),
        supabase.from('order_items').select('*').order('id'),
        supabase.from('product_variants').select('*').order('id'),
      ]);
      setProducts(prodData || []);
      setStaff(staffData || []);
      setCustomers(custData || []);
      setOrders(orderData || []);
      setOrderItems(itemsData || []);
      setProductVariants(varData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.code]);

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);
  useEffect(() => { if (user) setProfileData({ ...user }); }, [user]);

  // Image upload: store in Supabase Storage bucket "product-images"
  const handleUpload = async (file: File, setter: (url: string) => void, setUploading: (v: boolean) => void) => {
    if (!file.type.startsWith('image/')) { showAlert('Lütfen bir görsel dosyası seçin', 'error'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setter(data.publicUrl);
      showAlert('Görsel yüklendi!', 'success');
    } catch (err: any) {
      showAlert('Görsel yükleme başarısız: ' + (err.message || ''), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent, setter: (v: boolean) => void) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setter(true);
    else if (e.type === 'dragleave') setter(false);
  };

  const handleDrop = (e: React.DragEvent, setterUrl: (url: string) => void, setterUploading: (v: boolean) => void) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0], setterUrl, setterUploading);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setterUrl: (url: string) => void, setterUploading: (v: boolean) => void) => {
    if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0], setterUrl, setterUploading);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('products').insert({
        name: pName, category: pCategory, unit: pUnit, note: pNote,
        image_url: pImage || `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(pName)}`,
        wholesaler_code: user.code, status: 'active',
      });
      if (error) throw error;
      setPName(''); setPCategory(''); setPUnit('Metre'); setPNote(''); setPImage('');
      showAlert('Ürün eklendi!', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'Ürün eklenemedi', 'error'); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Ürünü silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showAlert('Ürün silindi', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'Silme işlemi başarısız', 'error'); }
  };

  const handleHoldProduct = async (id: number) => {
    try {
      const { error } = await supabase.from('products').update({ status: 'on_hold' }).eq('id', id);
      if (error) throw error;
      showAlert('Ürün beklemede', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'İşlem başarısız', 'error'); }
  };

  const handleActivateProduct = async (id: number) => {
    try {
      const { error } = await supabase.from('products').update({ status: 'active' }).eq('id', id);
      if (error) throw error;
      showAlert('Ürün aktifleştirildi', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'İşlem başarısız', 'error'); }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantModalProduct) return;
    try {
      const { error } = await supabase.from('product_variants').insert({
        product_id: variantModalProduct.id, variant_code: vCode, variant_name: vName, image_url: vImage
      });
      if (error) throw error;
      setVCode(''); setVName(''); setVImage('');
      showAlert('Varyant eklendi!', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'Varyant eklenemedi', 'error'); }
  };

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('Varyantı silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
      showAlert('Varyant silindi', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'Silme işlemi başarısız', 'error'); }
  };

  const getProductVariants = (productId: number) => productVariants.filter(v => v.product_id === productId);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = generateCode('DPC');
      const { data, error } = await supabase.from('warehouse_staff').insert({ full_name: sName, code }).select().single();
      if (error) throw error;
      setSName('');
      showAlert(`Personel eklendi! Kod: ${data.code}`, 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'Personel eklenemedi', 'error'); }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Personeli silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('warehouse_staff').delete().eq('id', id);
      if (error) throw error;
      showAlert('Personel silindi', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'Silme işlemi başarısız', 'error'); }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      showAlert('Müşteri silindi', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'Silme işlemi başarısız', 'error'); }
  };

  const handleCancelOrder = async (id: number) => {
    if (!confirm('Siparişi iptal etmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'İptal Edildi' }).eq('id', id);
      if (error) throw error;
      showAlert('Sipariş iptal edildi', 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'İşlem başarısız', 'error'); }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const handleExportERP = async () => {
    if (selectedOrders.length === 0) { showAlert('Lütfen en az bir sipariş seçin', 'error'); return; }
    if (!confirm(`${selectedOrders.length} siparişi ERP'ye aktarıp silmek istediğinize emin misiniz?`)) return;
    try {
      const csvRows: any[] = [['Siparis ID', 'Musteri', 'Tarih', 'Durum', 'Urun', 'Miktar', 'Birim', 'Varyant']];
      for (const orderId of selectedOrders) {
        const order = orders.find((o: any) => o.id === orderId);
        if (!order) continue;
        const items = getOrderItems(orderId);
        for (const it of items) {
          csvRows.push([order.id, `"${order.customer_name}"`, new Date(order.created_at).toLocaleDateString('tr-TR'), order.status, `"${it.product_name}"`, it.quantity, it.unit, it.variant_code || '-']);
        }
      }
      const csvContent = '\uFEFF' + csvRows.map((row: any[]) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `siparisler_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);

      for (const orderId of selectedOrders) {
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
      }
      const count = selectedOrders.length;
      setSelectedOrders([]);
      showAlert(`${count} sipariş ERP'ye aktarıldı ve silindi`, 'success'); fetchData();
    } catch (err: any) { showAlert(err.message || 'İşlem başarısız', 'error'); }
  };

  const handleSaveProfile = async () => {
    try {
      const { id, ...updates } = profileData;
      const { data, error } = await supabase.from('wholesalers').update(updates).eq('id', user.id).select().single();
      if (error) throw error;
      setUser(data); setEditingProfile(false);
      showAlert('Profil güncellendi', 'success');
    } catch (err: any) { showAlert(err.message || 'Güncelleme başarısız', 'error'); }
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const filteredProducts = products.filter(p => {
    if (productTab === 'active' && p.status !== 'active') return false;
    if (productTab === 'hold' && p.status !== 'on_hold') return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    return true;
  });
  const getOrderItems = (orderId: number) => orderItems.filter(oi => oi.order_id === orderId);

  const cardClass = `rounded-2xl p-6 transition-all ${darkMode ? 'bg-[#111827] border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${darkMode ? 'bg-[#1e293b] border-slate-600 text-white placeholder-slate-400 focus:border-[#0066FF]' : 'bg-white border-slate-200 text-[#0F172A] placeholder-slate-400 focus:border-[#0066FF]'}`;
  const displayClass = `px-4 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-[#1e293b] text-white border border-slate-700' : 'bg-slate-100 text-[#0F172A]'}`;
  const btnPrimary = 'px-4 py-2.5 bg-[#0066FF] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2';
  const btnDanger = 'px-3 py-2 bg-[#EF4444] text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all flex items-center gap-1.5';
  const btnWarning = 'px-3 py-2 bg-[#F97316] text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-all flex items-center gap-1.5';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#090D16] text-[#F9FAFB]' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
      <header className={`sticky top-0 z-30 border-b ${darkMode ? 'bg-[#090D16]/90 border-slate-800' : 'bg-[#F8FAFC]/90 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Takip<span className="text-[#0066FF]">.</span> <span className="text-sm font-normal text-slate-400">Yönetici Paneli</span></h1>
            <div className="hidden md:flex items-center gap-1 ml-6">
              {[
                { key: 'products', label: 'Ürün Yönetimi', icon: <Package size={14} /> },
                { key: 'staff', label: 'Personel', icon: <Users size={14} /> },
                { key: 'customers', label: 'Müşteriler', icon: <Store size={14} /> },
                { key: 'orders', label: 'Sipariş Takibi', icon: <ClipboardList size={14} /> },
                { key: 'profile', label: 'Profilim', icon: <UserCircle size={14} /> },
              ].map(s => (
                <button key={s.key} onClick={() => setActiveSection(s.key as any)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${activeSection === s.key ? 'bg-[#0066FF] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  {s.icon}{s.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { setUser(null); setUserType(''); setScreen('landing'); }} className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-[#EF4444] transition-colors flex items-center gap-2">
            <LogOut size={14} />Çıkış Yap
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeSection === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus size={18} className="text-[#0066FF]" /> Yeni Ürün Ekle</h2>
                <form onSubmit={handleAddProduct} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input className={inputClass} placeholder="Ürün Adı" value={pName} onChange={e => setPName(e.target.value)} required />
                  <input className={inputClass} placeholder="Kategori" value={pCategory} onChange={e => setPCategory(e.target.value)} required />
                  <select className={inputClass} value={pUnit} onChange={e => setPUnit(e.target.value)}>{units.map(u => <option key={u} value={u}>{u}</option>)}</select>
                  <input className={inputClass} placeholder="Ürün Notu" value={pNote} onChange={e => setPNote(e.target.value)} />
                  <div className="md:col-span-2 lg:col-span-2">
                    <div onDragEnter={(e) => handleDrag(e, setDragActive)} onDragLeave={(e) => handleDrag(e, setDragActive)} onDragOver={(e) => handleDrag(e, setDragActive)} onDrop={(e) => handleDrop(e, setPImage, setUploadingImage)} onClick={() => fileInputRef.current?.click()} className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 transition-all flex flex-col items-center justify-center gap-2 ${dragActive ? 'border-[#0066FF] bg-[#0066FF]/5' : darkMode ? 'border-slate-600 bg-[#1e293b] hover:border-slate-500' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPImage, setUploadingImage)} className="hidden" />
                      {uploadingImage ? <Loader2 size={20} className="animate-spin text-[#0066FF]" /> : pImage ? (
                        <div className="flex items-center gap-3">
                          <img src={pImage} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                          <div className="text-xs text-slate-500 dark:text-slate-400">Görsel yüklendi. Tıklayıp değiştirebilirsiniz.</div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setPImage(''); }} className="p-1 text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X size={14} /></button>
                        </div>
                      ) : (<><ImageIcon size={20} className="text-slate-400" /><p className="text-xs text-slate-400 text-center">Görsel sürükle-bırak veya tıklayıp seçin<br /><span className="text-[10px] text-slate-500">PNG, JPG, WEBP (max 5MB)</span></p></>)}
                    </div>
                  </div>
                  <div className="flex items-end"><button type="submit" className={btnPrimary}><Plus size={16} /> Ürün Ekle</button></div>
                </form>
              </div>

              <div className={cardClass}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setProductTab('active')} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${productTab === 'active' ? 'bg-[#0066FF] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Aktif Ürünler</button>
                    <button onClick={() => setProductTab('hold')} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${productTab === 'hold' ? 'bg-[#F97316] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Beklemede Olanlar</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-9`} placeholder="Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                    <select className={inputClass} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="">Tüm Kategoriler</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                </div>
                {loading ? <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#0066FF]" /></div> : filteredProducts.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">Ürün bulunamadı.</div> : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(p => {
                      const variants = getProductVariants(p.id);
                      return (
                        <div key={p.id} className={`rounded-xl p-4 border transition-all ${darkMode ? 'bg-[#0f1520] border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div><h3 className="font-medium text-sm">{p.name}</h3><p className="text-xs text-slate-400">{p.category} · {p.unit}</p></div>
                            <div className="flex items-center gap-1">
                              {productTab === 'active' ? <button onClick={() => handleHoldProduct(p.id)} className={btnWarning}><PauseCircle size={12} /> Bekle</button> : <button onClick={() => handleActivateProduct(p.id)} className="px-3 py-2 bg-[#10B981] text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-all flex items-center gap-1.5"><CheckCircle size={12} /> Aktif</button>}
                              <button onClick={() => handleDeleteProduct(p.id)} className={btnDanger}><Trash2 size={12} /> Sil</button>
                            </div>
                          </div>
                          {p.note && <p className="text-xs text-slate-500 mb-2">{p.note}</p>}
                          <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                          <button onClick={() => { setVariantModalProduct(p); setVCode(''); setVName(''); setVImage(''); }} className="w-full py-2 bg-[#0066FF]/10 text-[#0066FF] rounded-xl text-xs font-medium hover:bg-[#0066FF]/20 transition-all flex items-center justify-center gap-2">
                            <Palette size={14} /> Varyant Yönetimi {variants.length > 0 && `(${variants.length})`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'staff' && (
            <motion.div key="staff" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users size={18} className="text-[#0066FF]" /> Personel Ekle</h2>
                <form onSubmit={handleAddStaff} className="flex gap-4">
                  <input className={`${inputClass} flex-1`} placeholder="Personel Adı Soyadı" value={sName} onChange={e => setSName(e.target.value)} required />
                  <button type="submit" className={btnPrimary}><Plus size={16} /> Ekle</button>
                </form>
              </div>
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4">Aktif Personel</h2>
                {staff.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Personel bulunamadı.</div> : (
                  <div className="space-y-3">
                    {staff.map(s => (
                      <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-[#0f1520]' : 'bg-slate-50'}`}>
                        <div><p className="font-medium text-sm">{s.full_name}</p><p className="text-xs text-slate-400">Kod: <span className="font-mono text-[#0066FF]">{s.code}</span></p></div>
                        <button onClick={() => handleDeleteStaff(s.id)} className={btnDanger}><Trash2 size={12} /> Sil</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'customers' && (
            <motion.div key="customers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className={cardClass}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Store size={18} className="text-[#0066FF]" /> Kayıtlı Müşteriler</h2>
                <p className="text-xs text-slate-400 mb-4">Kodunuzla ({user?.code}) kayıt olan müşteriler</p>
                {customers.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Henüz kayıtlı müşteri bulunmuyor.</div> : (
                  <div className="space-y-3">
                    {customers.map(c => (
                      <div key={c.id} className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-[#0f1520]' : 'bg-slate-50'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{c.store_name}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={10} /> {c.phone}</span>
                            {c.email && <span className="flex items-center gap-1 text-xs text-[#0066FF]"><Mail size={10} /> {c.email}</span>}
                            <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCustomer(c.id)} className={btnDanger}><Trash2 size={12} /> Sil</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className={cardClass}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardList size={18} className="text-[#0066FF]" /> Gelen Siparişler</h2>
                  {selectedOrders.length > 0 && (
                    <button onClick={handleExportERP} className="px-4 py-2.5 bg-[#0066FF] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2">
                      <Boxes size={14} /> ERP'ye Aktar ({selectedOrders.length})
                    </button>
                  )}
                </div>
                {orders.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">Sipariş bulunamadı.</div> : (
                  <div className="space-y-4">
                    {orders.map(o => {
                      const items = getOrderItems(o.id);
                      const statusColor = o.status === 'Hazır' ? 'border-emerald-500' : o.status === 'Hazırlanıyor' ? 'border-orange-400' : o.status === 'Beklemede' ? 'border-[#F97316]' : o.status === 'İptal Edildi' ? 'border-red-400' : 'border-slate-300';
                      const isSelected = selectedOrders.includes(o.id);
                      return (
                        <div key={o.id} className={`rounded-xl p-5 border-l-4 ${statusColor} ${darkMode ? 'bg-[#0f1520]' : 'bg-slate-50'} ${isSelected ? 'ring-2 ring-[#0066FF]/30' : ''}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {o.status === 'Hazır' && <input type="checkbox" checked={isSelected} onChange={() => toggleOrderSelection(o.id)} className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]" />}
                              <div><h3 className="font-medium text-sm">{o.customer_name}</h3><p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('tr-TR')} · {items.length} ürün</p></div>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${o.status === 'Hazır' ? 'bg-emerald-100 text-emerald-700' : o.status === 'Hazırlanıyor' ? 'bg-orange-100 text-orange-700' : o.status === 'Beklemede' ? 'bg-amber-100 text-amber-700' : o.status === 'İptal Edildi' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                          </div>
                          <div className="space-y-1 mb-4">
                            {items.map(it => (
                              <div key={it.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">{it.product_name}{it.variant_code ? ` — Renk ${it.variant_code}` : ''}</span>
                                <span className="font-medium">{it.quantity} {it.unit}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            {o.status !== 'İptal Edildi' && o.status !== 'Hazır' && <button onClick={() => handleCancelOrder(o.id)} className={btnDanger}><XCircle size={12} /> Siparişi İptal Et</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
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
                  {[{ key: 'first_name', label: 'Ad' }, { key: 'last_name', label: 'Soyad' }, { key: 'phone', label: 'Telefon' }, { key: 'address', label: 'Adres' }, { key: 'company_name', label: 'Firma Adı' }, { key: 'email', label: 'E-posta' }].map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
                      {editingProfile ? <input className={inputClass} value={profileData[field.key] || ''} onChange={e => setProfileData({ ...profileData, [field.key]: e.target.value })} /> : <div className={displayClass}>{user?.[field.key] || '-'}</div>}
                    </div>
                  ))}
                  <div><label className="text-xs text-slate-400 mb-1 block">Toptancı Kodu</label><div className="px-4 py-2.5 rounded-xl bg-[#0066FF]/10 text-[#0066FF] text-sm font-mono font-medium">{user?.code}</div></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Variant Modal */}
      <AnimatePresence>
        {variantModalProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setVariantModalProduct(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={`w-full max-w-lg rounded-3xl p-6 max-h-[85vh] overflow-y-auto ${darkMode ? 'bg-[#111827] border border-slate-800' : 'bg-white border border-slate-100 shadow-xl'}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{variantModalProduct.name} — Varyant Yönetimi</h3>
                <button onClick={() => setVariantModalProduct(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} /></button>
              </div>
              <form onSubmit={handleAddVariant} className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Renk Kodu (örn: 56)" value={vCode} onChange={e => setVCode(e.target.value)} required />
                  <input className={inputClass} placeholder="Renk Adı (örn: Kırmızı)" value={vName} onChange={e => setVName(e.target.value)} required />
                </div>
                <div onDragEnter={(e) => handleDrag(e, setDragActive)} onDragLeave={(e) => handleDrag(e, setDragActive)} onDragOver={(e) => handleDrag(e, setDragActive)} onDrop={(e) => { setDragActive(false); handleDrop(e, setVImage, setUploadingVImage); }} onClick={() => vFileInputRef.current?.click()} className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 transition-all flex flex-col items-center justify-center gap-2 ${dragActive ? 'border-[#0066FF] bg-[#0066FF]/5' : darkMode ? 'border-slate-600 bg-[#1e293b] hover:border-slate-500' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}>
                  <input ref={vFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, setVImage, setUploadingVImage)} className="hidden" />
                  {uploadingVImage ? <Loader2 size={20} className="animate-spin text-[#0066FF]" /> : vImage ? (
                    <div className="flex items-center gap-3">
                      <img src={vImage} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                      <div className="text-xs text-slate-500 dark:text-slate-400">Görsel yüklendi.</div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setVImage(''); }} className="p-1 text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X size={14} /></button>
                    </div>
                  ) : (<><ImageIcon size={20} className="text-slate-400" /><p className="text-xs text-slate-400 text-center">Varyant görseli sürükle-bırak veya tıklayın</p></>)}
                </div>
                <button type="submit" className={btnPrimary}><Plus size={16} /> Varyant Ekle</button>
              </form>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400">Mevcut Varyantlar</h4>
                {getProductVariants(variantModalProduct.id).length === 0 ? <p className="text-xs text-slate-400">Henüz varyant eklenmemiş.</p> : (
                  <div className="grid grid-cols-2 gap-3">
                    {getProductVariants(variantModalProduct.id).map(v => (
                      <div key={v.id} className={`rounded-xl p-3 border ${darkMode ? 'bg-[#0f1520] border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div><p className="text-sm font-medium">{v.variant_name}</p><p className="text-xs text-slate-400">Kod: {v.variant_code}</p></div>
                          <button onClick={() => handleDeleteVariant(v.id)} className="p-1 text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={12} /></button>
                        </div>
                        {v.image_url && <img src={v.image_url} alt={v.variant_name} className="w-full h-20 object-cover rounded-lg" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
