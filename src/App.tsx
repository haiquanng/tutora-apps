import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { HomeworkPage } from './pages/HomeworkPage';
import { HistoryPage } from './pages/HistoryPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AppPage } from './pages/AppPage';
import { AuthProvider } from './hooks/AuthProvider';
import { getQuota } from './services/quota.service';

const DESKTOP_QUERY = '(min-width: 1024px)';

const App = () => {
  // Desktop mở sẵn, mobile đóng — toggle ở header dùng chung cho cả hai.
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const [quota, setQuota] = useState(getQuota);

  // Thu hẹp xuống mobile thì đóng sidebar để nó không che nội dung.
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setSidebarOpen(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // HomeworkPage gọi lại sau mỗi lượt hỏi để panel hạn mức cập nhật.
  const refreshQuota = useCallback(() => setQuota(getQuota()), []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Header quota={quota} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <Sidebar quota={quota} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* pt-14 chừa chỗ Header; lề trái chỉ đẩy khi sidebar đang mở ở desktop.
            h-screen (KHÔNG phải min-h-screen): phải có chiều cao cố định thì vùng
            cuộn bên trong mới bị kẹp, ô nhập mới ghim được ở đáy. */}
        <div className={`flex h-screen min-w-0 flex-col pt-14 transition-[padding] ${isSidebarOpen ? 'lg:pl-72' : ''}`}>
          <main className="flex min-h-0 flex-1 flex-col">
            <Routes>
              <Route path="/" element={<HomeworkPage onQuotaChange={refreshQuota} />} />
              {/* Mỗi cuộc hỏi bài có URL riêng -> chia sẻ / F5 / back đều giữ được. */}
              <Route path="/c/:chatId" element={<HomeworkPage onQuotaChange={refreshQuota} />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/app" element={<AppPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
