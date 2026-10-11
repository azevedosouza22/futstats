import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',manifest:{name:'FutStats — Estatísticas de futebol',short_name:'FutStats',lang:'pt-BR',description:'Seu futebol em números',theme_color:'#143d2b',background_color:'#f5f7f6',display:'standalone',start_url:'/',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,png,svg,woff2}']}})]});
