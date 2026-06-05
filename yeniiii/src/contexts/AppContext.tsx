import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AppContextType {
  screen: string;
  setScreen: (screen: string) => void;
  user: any;
  setUser: (user: any) => void;
  userType: string;
  setUserType: (type: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  alert: { message: string; type: string } | null;
  showAlert: (message: string, type?: string) => void;
  clearAlert: () => void;
}

const AppContext = createContext<AppContextType>({
  screen: 'landing',
  setScreen: () => {},
  user: null,
  setUser: () => {},
  userType: '',
  setUserType: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
  alert: null,
  showAlert: () => {},
  clearAlert: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('takip-dark') === 'true';
    }
    return false;
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [alert, setAlert] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('takip-dark', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const showAlert = useCallback((message: string, type: string = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const clearAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      user, setUser,
      userType, setUserType,
      darkMode, toggleDarkMode,
      refreshTrigger, triggerRefresh,
      alert, showAlert, clearAlert,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
