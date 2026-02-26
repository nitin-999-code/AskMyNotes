import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        // Enable SPA fallback so /app route works on refresh
        historyApiFallback: true,
    },
})
