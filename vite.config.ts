
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  // Using the specific Qwen API Key provided
  const apiKey = env.API_KEY || "sk-e5e7b33d1f684e66be3cd51e52ae0bab";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      proxy: {
        '/api/qwen/text': {
          target: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen\/text/, '')
        },
        '/api/qwen/multimodal': {
          target: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen\/multimodal/, '')
        }
      }
    }
  };
});
