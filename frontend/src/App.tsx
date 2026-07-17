import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TranslatorPage from './pages/TranslatorPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

type Tab = 'translate' | 'history';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('translate');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🌐</span>
            <h1>PolyGlot</h1>
            <span className="logo-subtitle">PDF Translation System</span>
          </div>
          <nav className="nav-tabs">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'translate' ? 'active' : ''}`}
              onClick={() => setActiveTab('translate')}
            >
              📄 Translate
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📋 History
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'translate' && <TranslatorPage />}
        {activeTab === 'history' && <HistoryPage />}
      </main>

      <footer className="app-footer">
        <p>PolyGlot PDF Translation System · Files are automatically deleted after download</p>
      </footer>

      <ToastContainer position="bottom-right" autoClose={4000} />
    </div>
  );
};

export default App;
