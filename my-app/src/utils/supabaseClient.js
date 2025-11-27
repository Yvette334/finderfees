import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.REACT_APP_SUPABASE_URL

const SUPABASE_ANON_KEY =
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.REACT_APP_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables missing. Please set SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
