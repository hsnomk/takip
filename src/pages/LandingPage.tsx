import { useApp } from '../contexts/AppContext';
import { motion } from 'framer-motion';
import { ArrowRight, Package, Users, ClipboardCheck, TrendingUp, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const { setScreen, darkMode } = useApp();

  const features = [
    {
      icon: <Package size={28} className="text-[#0066FF]" />,
      title: 'Toptancılar İçin',
      desc: 'Tüm siparişlerinizi tek ekrandan yönetin. Stok takibi, personel atama ve müşteri yönetimi artık çok kolay.',
      metric: '%40',
      metricLabel: 'Daha Hızlı İşlem',
    },
    {
      icon: <Users size={28} className="text-[#10B981]" />,
      title: 'Müşteriler İçin',
      desc: 'Mağazanzdan kolayca sipariş verin. Ürün kataloğunu görüntüleyin ve sipariş durumunuzu anlık takip edin.',
      metric: '%100',
      metricLabel: 'Doğruluk Oranı',
    },
    {
      icon: <ClipboardCheck size={28} className="text-[#F97316]" />,
      title: 'Depo Personeli İçin',
      desc: 'Siparişleri hatasız hazırlayın. Kontrol listesi sistemiyle her ürünü eksiksiz toplayın.',
      metric: '%60',
      metricLabel: 'Daha Az Hata',
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#090D16] text-[#F9FAFB]' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight"
          >
            Takip<span className="text-[#0066FF]">.</span>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setScreen('auth')}
            className="px-5 py-2.5 bg-[#0066FF] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            Sisteme Giriş Yap
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0066FF]/10 text-[#0066FF] text-sm font-medium mb-8">
              <Zap size={14} />
              Toptan Ticaretin Geleceği
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Toptan Siparişte<br />
              <span className="text-[#0066FF]">Sıfır Hata.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Takip, toptan ticaret işletmeleri için tasarlanmış modern sipariş yönetim platformudur. 
              Müşterilerinizden gelen siparişleri hatasız takip edin, depo operasyonlarınızı optimize edin.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen('auth')}
              className="px-8 py-4 bg-[#0066FF] text-white rounded-2xl text-base font-semibold hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/25 flex items-center gap-3 mx-auto"
            >
              Hemen Başlayın
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`p-8 rounded-2xl transition-all hover:shadow-xl ${
                  darkMode ? 'bg-[#111827] border border-slate-800' : 'bg-white border border-slate-100 shadow-sm'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{f.desc}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#0066FF]">{f.metric}</span>
                  <span className="text-sm text-slate-400">{f.metricLabel}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-400">© 2024 Takip. Tüm hakları saklıdır.</div>
          <div className="text-sm text-slate-400">Toptan Sipariş Yönetim Sistemi</div>
        </div>
      </footer>
    </div>
  );
}
