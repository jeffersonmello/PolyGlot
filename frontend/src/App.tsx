import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TranslatorPage from './pages/TranslatorPage';
import HistoryPage from './pages/HistoryPage';
import { Badge } from './components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Languages } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'translate' | 'history'>('translate');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">PolyGlot</span>
              <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 border-indigo-100">
                v2.0
              </Badge>
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-1 font-normal">PDF Translation System</span>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'translate' | 'history')}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="translate" className="gap-1.5 text-xs sm:text-sm">
                <span>📄</span> Translate
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
                <span>📋</span> History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'translate' && <TranslatorPage />}
          {activeTab === 'history' && <HistoryPage />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          PolyGlot PDF Translation System · Files are automatically deleted after download
        </p>
      </footer>

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        toastClassName="rounded-xl shadow-lg text-sm"
      />
    </div>
  );
};

export default App;

