import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    return {
        base: command === 'build' ? '/ProyectoFinal/' : '/',
        plugins: [react()],
        server: {
            port: 5173,
            host: true, // Permitir acceso desde dispositivos en la misma red local (Wi-Fi)
            proxy: {
                '/api': {
                    target: 'http://localhost:5000',
                    changeOrigin: true,
                }
            }
        }
    }
})
