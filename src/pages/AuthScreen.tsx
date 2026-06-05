import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Store, Warehouse, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function generateCode(prefix: string) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const tabs = [
  { key: 'wholesaler', label: 'Toptancı', icon: <User size={16} /> },
  { key: 'customer', label: 'Müşteri', icon: <Store size={16} /> },
  { key: 'staff', label: 'Depocu', icon: <Warehouse size={16} /> },
];

export default function AuthScreen() {
  const { setScreen, setUser, setUserType, darkMode, showAlert } = useApp();
  const [activeTab, setActiveTab] = useState('wholesaler');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [wholesalerMode, setWholesalerMode] = useState<'register' | 'login'>('register');
  const [customerMode, setCustomerMode] = useState<'register' | 'login'>('login');

  // Wholesaler register
  const [wFirstName, setWFirstName] = useState('');
  const [wLastName, setWLastName] = useState('');
  const [wPhone, setWPhone] = useState('');
  const [wAddress, setWAddress] = useState('');
  const [wCompany, setWCompany] = useState('');
  const [wEmail, setWEmail] = useState('');
  const [wPassword, setWPassword] = useState('');

  // Wholesaler login
  const [wLoginEmail, setWLoginEmail] = useState('');
  const [wLoginPassword, setWLoginPassword] = useState('');

  // Customer register
  const [cStore, setCStore] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cCode, setCCode] = useState('');

  // Customer login
  const [cLoginStore, setCLoginStore] = useState('');
  const [cLoginPhone, setCLoginPhone] = useState('');
  const [cLoginCode, setCLoginCode] = useState('');

  // Staff login
  const [sName, setSName] = useState('');
  const [sCode, setSCode] = useState('');

  const handleWholesalerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const code = generateCode('TKP');
      const { data, error } = await supabase
        .from('wholesalers')
        .insert({
          first_name: wFirstName,
          last_name: wLastName,
          phone: wPhone,
          address: wAddress,
          company_name: wCompany,
          email: wEmail,
          password: wPassword,
          code,
        })
        .select()
        .single();
      if (error) throw error;
      setUser(data);
      setUserType('wholesaler');
      showAlert(`Kayıt başarılı! Toptancı kodunuz: ${data.code}`, 'success');
      setScreen('manager');
    } catch (err: any) {
      showAlert(err.message || 'Kayıt başarısız', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWholesalerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wholesalers')
        .select('*')
        .eq('email', wLoginEmail)
        .eq('password', wLoginPassword)
        .single();
      if (error || !data) throw new Error('Geçersiz e-posta veya şifre');
      setUser(data);
      setUserType('wholesaler');
      showAlert('Giriş başarılı!', 'success');
      setScreen('manager');
    } catch (err: any) {
      showAlert(err.message || 'Giriş başarısız', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ store_name: cStore, phone: cPhone, email: cEmail, wholesaler_code: cCode })
        .select()
        .single();
      if (error) throw error;
      setUser(data);
      setUserType('customer');
      showAlert('Müşteri kaydı başarılı!', 'success');
      setScreen('customer');
    } catch (err: any) {
      showAlert(err.message || 'Kayıt başarısız', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_name', cLoginStore)
        .eq('phone', cLoginPhone)
        .eq('wholesaler_code', cLoginCode)
        .single();
      if (error || !data) throw new Error('Geçersiz müşteri bilgileri');
      setUser(data);
      setUserType('customer');
      showAlert('Müşteri girişi başarılı!', 'success');
      setScreen('customer');
    } catch (err: any) {
      showAlert(err.message || 'Giriş başarısız', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('warehouse_staff')
        .select('*')
        .eq('full_name', sName)
        .eq('code', sCode)
        .single();
      if (error || !data) throw new Error('Geçersiz personel bilgileri');
      setUser(data);
      setUserType('staff');
      showAlert('Depocu girişi başarılı!', 'success');
      setScreen('warehouse');
    } catch (err: any) {
      showAlert(err.message || 'Giriş başarısız', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
    darkMode
      ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500 focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/30'
      : 'bg-white border-slate-200 text-[#0F172A] placeholder-slate-400 focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/30'
  }`;

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${darkMode ? 'bg-[#090D16]' : 'bg-[#F8FAFC]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md rounded-3xl p-8 shadow-xl ${darkMode ? 'bg-[#111827] border border-slate-800' : 'bg-white border border-slate-100'}`}
      >
        <button
          onClick={() => setScreen('landing')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Geri Dön
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Takip<span className="text-[#0066FF]">.</span></h1>
          <p className="text-sm text-slate-400">Hesabınıza erişim sağlayın</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#0066FF] text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'wholesaler' && (
            <motion.div
              key="wholesaler"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 mb-6">
                <button
                  onClick={() => setWholesalerMode('register')}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                    wholesalerMode === 'register' ? 'bg-white dark:bg-slate-700 text-[#0066FF] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Kayıt Ol
                </button>
                <button
                  onClick={() => setWholesalerMode('login')}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                    wholesalerMode === 'login' ? 'bg-white dark:bg-slate-700 text-[#0066FF] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Giriş Yap
                </button>
              </div>

              {wholesalerMode === 'register' ? (
                <form onSubmit={handleWholesalerRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} placeholder="Ad" value={wFirstName} onChange={e => setWFirstName(e.target.value)} required />
                    <input className={inputClass} placeholder="Soyad" value={wLastName} onChange={e => setWLastName(e.target.value)} required />
                  </div>
                  <input className={inputClass} placeholder="Telefon" value={wPhone} onChange={e => setWPhone(e.target.value)} required />
                  <input className={inputClass} placeholder="Adres" value={wAddress} onChange={e => setWAddress(e.target.value)} required />
                  <input className={inputClass} placeholder="Firma Adı" value={wCompany} onChange={e => setWCompany(e.target.value)} required />
                  <input className={inputClass} type="email" placeholder="E-posta" value={wEmail} onChange={e => setWEmail(e.target.value)} required />
                  <div className="relative">
                    <input
                      className={inputClass}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Şifre"
                      value={wPassword}
                      onChange={e => setWPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0066FF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Kayıt Ol'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleWholesalerLogin} className="space-y-4">
                  <input className={inputClass} type="email" placeholder="E-posta" value={wLoginEmail} onChange={e => setWLoginEmail(e.target.value)} required />
                  <div className="relative">
                    <input
                      className={inputClass}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Şifre"
                      value={wLoginPassword}
                      onChange={e => setWLoginPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0066FF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Giriş Yap'}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === 'customer' && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 mb-6">
                <button
                  onClick={() => setCustomerMode('register')}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                    customerMode === 'register' ? 'bg-white dark:bg-slate-700 text-[#0066FF] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Kayıt Ol
                </button>
                <button
                  onClick={() => setCustomerMode('login')}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                    customerMode === 'login' ? 'bg-white dark:bg-slate-700 text-[#0066FF] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Giriş Yap
                </button>
              </div>

              {customerMode === 'register' ? (
                <form onSubmit={handleCustomerRegister} className="space-y-4">
                  <input className={inputClass} placeholder="Mağaza Adı" value={cStore} onChange={e => setCStore(e.target.value)} required />
                  <input className={inputClass} type="email" placeholder="E-posta Adresi" value={cEmail} onChange={e => setCEmail(e.target.value)} required />
                  <input className={inputClass} placeholder="Telefon" value={cPhone} onChange={e => setCPhone(e.target.value)} required />
                  <input className={inputClass} placeholder="Toptancı Kodu (örn: TKP-7412)" value={cCode} onChange={e => setCCode(e.target.value)} required />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0066FF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Kayıt Ol'}
                  </button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('login')}
                      className="text-xs text-[#0066FF] hover:underline font-medium"
                    >
                      Zaten hesabınız var mı? Giriş Yapın
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCustomerLogin} className="space-y-4">
                  <input className={inputClass} placeholder="Mağaza Adı" value={cLoginStore} onChange={e => setCLoginStore(e.target.value)} required />
                  <input className={inputClass} placeholder="Telefon" value={cLoginPhone} onChange={e => setCLoginPhone(e.target.value)} required />
                  <input className={inputClass} placeholder="Toptancı Kodu (örn: TKP-7412)" value={cLoginCode} onChange={e => setCLoginCode(e.target.value)} required />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0066FF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Müşteri Girişi'}
                  </button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('register')}
                      className="text-xs text-[#0066FF] hover:underline font-medium"
                    >
                      Hesabınız yok mu? Kayıt Olun
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === 'staff' && (
            <motion.form
              key="staff"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleStaffLogin}
              className="space-y-4"
            >
              <input className={inputClass} placeholder="İsim Soyisim" value={sName} onChange={e => setSName(e.target.value)} required />
              <input className={inputClass} placeholder="Depocu Kodu (örn: DPC-1234)" value={sCode} onChange={e => setSCode(e.target.value)} required />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0066FF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Depocu Girişi'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
