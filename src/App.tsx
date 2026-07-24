import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { HomeworkPage } from './pages/HomeworkPage';
import { HistoryPage } from './pages/HistoryPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { StudyResourcePage } from './pages/StudyResourcePage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { NotePage } from './pages/NotePage';
import { NotesListPage } from './pages/NotesListPage';
import { AppPage } from './pages/AppPage';
import { AuthProvider } from './hooks/AuthProvider';
import { useHistory } from './hooks/useHistory';
import { getQuota } from './services/quota.service';

const DESKTOP_QUERY = '(min-width: 1024px)';

const App = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const [quota, setQuota] = useState(getQuota);
  const { items: history, isLoading: historyLoading, reload: reloadHistory, remove: removeHistory } = useHistory();

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setSidebarOpen(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const refreshQuota = useCallback(() => {
    setQuota(getQuota());
    reloadHistory();
  }, [reloadHistory]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Header quota={quota} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <Sidebar
          quota={quota}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          history={history}
          historyLoading={historyLoading}
          onDeleteHistory={removeHistory}
        />

        <div
          className={`flex h-screen min-w-0 flex-col pt-14 transition-[padding] ${
            isSidebarOpen ? 'lg:pl-72' : 'lg:pl-16'
          }`}
        >
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <Routes>
              <Route path="/" element={<HomeworkPage onQuotaChange={refreshQuota} />} />
              {/* Mỗi cuộc hỏi bài có URL riêng -> chia sẻ / F5 / back đều giữ được. */}
              <Route path="/c/:chatId" element={<HomeworkPage onQuotaChange={refreshQuota} />} />
              <Route path="/notes" element={<NotesListPage />} />
              <Route path="/notes/:noteId" element={<NotePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/:subjectSlug" element={<StudyResourcePage />} />
              <Route path="/resources/:subjectSlug/:chapterSlug" element={<StudyResourcePage />} />
              <Route path="/resources/:subjectSlug/q/:questionId" element={<QuestionDetailPage />} />
              <Route path="/resources/:subjectSlug/:chapterSlug/q/:questionId" element={<QuestionDetailPage />} />
              <Route path="/app" element={<AppPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
