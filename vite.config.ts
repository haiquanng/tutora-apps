import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5180,
      proxy: {
        // Proxy /api/v1 -> tutora-ai để dev không vướng CORS/preflight khi stream SSE.
        '/api/v1': {
          target: env.VITE_AI_URL || 'http://localhost:8000',
          changeOrigin: true,
          // X-API-Key gắn Ở ĐÂY, không phải trong code FE: biến VITE_* bị nhúng
          // thẳng vào bundle JS nên ai mở DevTools cũng đọc được. Qua proxy thì key
          // chỉ nằm ở dev server. Production phải có BE proxy tương tự (xem README).
          headers: env.AI_API_KEY ? { 'X-API-Key': env.AI_API_KEY } : undefined,
        },
      },
    },
  };
});
