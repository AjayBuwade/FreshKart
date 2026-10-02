import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{proxy:{'/api':'https://freshkart-47e8.onrender.com/apilocalhost:5000'}}});
