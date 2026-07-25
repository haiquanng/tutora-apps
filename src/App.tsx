import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
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
import { UpgradePage } from './pages/UpgradePage';
import { AuthProvider } from './hooks/AuthProvider';
import { useHistory } from './hooks/useHistory';
import { useAiBalance } from './hooks/useAiBalance';

const DESKTOP_QUERY = '(min-width: 1024px)';

const HomeworkPane = ({ onSolved }: { onSolved: () => void }) => {
  const { pathname } = useLocation();
  const active = pathname === '/' || pathname.startsWith('/c/');
  return (
    <div className={active ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
      <HomeworkPage onSolved={onSolved} />
    </div>
  );
};

const App = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const { balance: aiBalance, onSpent: onCreditSpent } = useAiBalance();
  const { items: history, isLoading: historyLoading, reload: reloadHistory, remove: removeHistory } = useHistory();

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setSidebarOpen(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const afterSolve = useCallback(() => {
    onCreditSpent();
    void reloadHistory();
  }, [onCreditSpent, reloadHistory]);

  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'rounded-xl border border-navy/10 bg-white text-navy',
            success: 'text-forest',
            error: 'text-burgundy',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/upgrade" element={<UpgradePage />} />

          <Route
            path="*"
            element={
              <>
                <Header aiBalance={aiBalance} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
                <Sidebar
                  aiBalance={aiBalance}
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
                    <HomeworkPane onSolved={afterSolve} />
                    <Routes>
                      <Route path="/" element={null} />
                      <Route path="/c/:chatId" element={null} />
                      <Route path="/notes" element={<NotesListPage />} />
                      <Route path="/notes/:noteId" element={<NotePage />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/resources" element={<ResourcesPage />} />
                      <Route path="/resources/:subjectSlug" element={<StudyResourcePage />} />
                      <Route path="/resources/:subjectSlug/:chapterSlug" element={<StudyResourcePage />} />
                      <Route path="/resources/:subjectSlug/q/:questionId" element={<QuestionDetailPage />} />
                      <Route
                        path="/resources/:subjectSlug/:chapterSlug/q/:questionId"
                        element={<QuestionDetailPage />}
                      />
                      <Route path="/app" element={<AppPage />} />
                    </Routes>
                  </main>
                </div>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
