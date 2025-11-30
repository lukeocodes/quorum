import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    base: './',
    envPrefix: 'PUBLIC_',
    server: {
        host: process.env.HOST || 'localhost',
        port: parseInt(process.env.PORT || '5173', 10),
    },
})
