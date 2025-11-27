import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Allow both legacy CRA-style (REACT_APP_) and plain SUPABASE_ env vars
  envPrefix: ['VITE_', 'REACT_APP_', 'SUPABASE_'],
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }), tailwindcss(),
  ],
})
