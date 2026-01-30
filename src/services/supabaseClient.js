import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Configuramos el cliente con soporte para Realtime y manejo de sesiones
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Mantiene la sesión iniciada al cerrar el navegador
    autoRefreshToken: true, // Refresca el token de seguridad automáticamente
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Optimiza el flujo de datos en tiempo real
    }
  }
});