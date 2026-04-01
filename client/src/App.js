import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import LessonsPage from './pages/LessonsPage';
import FlashcardsPage from './pages/FlashcardsPage';
import PracticePage from './pages/PracticePage';
import ProgressPage from './pages/ProgressPage';
import './App.css';

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-logo float">🌿</div>
        <div className="app-loading-text">Lingua</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const pages = {
    dashboard: <DashboardPage onNavigate={setPage} />,
    lessons: <LessonsPage />,
    flashcards: <FlashcardsPage />,
    practice: <PracticePage onNavigate={setPage} />,
    progress: <ProgressPage />,
  };

  return (
    <div className="app">
      <Navbar activePage={page} onNavigate={setPage} />
      <main className="app-main">
        {pages[page] || pages.dashboard}
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
