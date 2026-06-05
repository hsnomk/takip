import { useApp } from './contexts/AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import AuthScreen from './pages/AuthScreen';
import ManagerDashboard from './pages/ManagerDashboard';
import CustomerPanel from './pages/CustomerPanel';
import WarehousePanel from './pages/WarehousePanel';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

function AlertToast() {
  const { alert, clearAlert } = useApp();
  if (!alert) return null;
  const icon = alert.type === 'success' ? <CheckCircle size={16} className="text-[#10B981]" /> :
               alert.type === 'error' ? <XCircle size={16} className="text-[#EF4444]" /> :
               <AlertCircle size={16} className="text-[#0066FF]" />;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 bg-white border border-slate-200 text-black"
    >
      {icon}
      <span className="text-sm font-medium text-black">{alert.message}</span>
      <button onClick={clearAlert} className="ml-2 text-slate-500 hover:text-black"><XCircle size={14} /></button>
    </motion.div>
  );
}

export default function App() {
  const { screen } = useApp();

  return (
    <div className="min-h-screen">
      <AlertToast />
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <LandingPage />
          </motion.div>
        )}
        {screen === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <AuthScreen />
          </motion.div>
        )}
        {screen === 'manager' && (
          <motion.div key="manager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ManagerDashboard />
          </motion.div>
        )}
        {screen === 'customer' && (
          <motion.div key="customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <CustomerPanel />
          </motion.div>
        )}
        {screen === 'warehouse' && (
          <motion.div key="warehouse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <WarehousePanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
