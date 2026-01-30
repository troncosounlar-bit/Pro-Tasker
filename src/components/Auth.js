import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/LogoPT.png'; // Importación correcta
import toast from 'react-hot-toast';

const Auth = () => {
  const [mode, setMode] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [fade, setFade] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    role: 'Developer' 
  });

  const changeMode = (newMode) => {
    setFade(false);
    setTimeout(() => {
      setMode(newMode);
      setFade(true);
    }, 200);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          await supabase.from('profiles').insert([
            { 
              id: data.user.id, 
              full_name: formData.fullName, 
              role: formData.role,
              email: formData.email,
              last_sign_in_at: new Date().toISOString()
            }
          ]);
          toast.success('Cuenta creada. Revisa tu email para confirmar.');
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success('Sesión iniciada');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        toast.success('Email de recuperación enviado');
        changeMode('login');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');`}
      </style>

      <div style={{ ...styles.authCard, opacity: fade ? 1 : 0 }}>
        
        <div style={styles.logoWrapper}>
          {/* CAMBIO CLAVE: Usamos la variable 'logo' importada */}
          <img src={logo} alt="Pro-Tasker Logo" style={styles.logoImgAuth} />
        </div>

        <form onSubmit={handleAuth} style={styles.form}>
          <h2 style={styles.modeTitle}>
            {mode === 'login' ? 'Bienvenido de nuevo' : mode === 'register' ? 'Crea tu cuenta corporativa' : 'Recuperar acceso'}
          </h2>

          {mode === 'register' && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Nombre Completo</label>
                <input 
                  style={styles.input} 
                  required 
                  placeholder="Ej: Alex Smith"
                  onChange={e => setFormData({...formData, fullName: e.target.value})} 
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Rol de Usuario</label>
                <select 
                  style={styles.input} 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Developer">Developer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Designer">Designer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Dirección de Email</label>
            <input 
              type="email" 
              style={styles.input} 
              required 
              placeholder="nombre@empresa.com"
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          {mode !== 'reset' && (
            <div style={styles.field}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <label style={styles.label}>Contraseña</label>
                {mode === 'login' && (
                  <span onClick={() => changeMode('reset')} style={styles.linkSmall}>¿Olvidó su contraseña?</span>
                )}
              </div>
              <input 
                type="password" 
                style={styles.input} 
                required 
                placeholder="••••••••"
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          )}

          <button type="submit" style={styles.btnPri} disabled={loading}>
            {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Registrarse ahora' : 'Enviar instrucciones')}
          </button>
        </form>

        <div style={styles.footer}>
          {mode === 'login' ? (
            <p>¿Aún no tienes cuenta? <span onClick={() => changeMode('register')} style={styles.link}>Regístrate</span></p>
          ) : (
            <p>¿Ya eres usuario? <span onClick={() => changeMode('login')} style={styles.link}>Inicia sesión</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', justifyContent: 'center', alignItems: 'center', 
    height: '100vh', background: '#f4f7fa', padding: '20px',
    fontFamily: "'Inter', sans-serif"
  },
  authCard: { 
    background: 'white', width: '100%', maxWidth: '420px', padding: '10px 45px 45px', 
    borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center', 
    transition: 'opacity 0.2s ease-in-out', boxSizing: 'border-box', overflow: 'hidden'
  },
  logoWrapper: { 
    display: 'flex', justifyContent: 'center', alignItems: 'center', 
    height: '150px', marginBottom: '5px' 
  },
  logoImgAuth: { 
    width: '300px', height: '300px', objectFit: 'contain', 
    marginTop: '-5px'
  },
  modeTitle: { 
    fontSize: '1.25rem', color: '#0f172a', marginBottom: '30px', 
    fontWeight: '700', letterSpacing: '-0.025em' 
  },
  field: { marginBottom: '22px', textAlign: 'left', width: '100%' },
  label: { 
    display: 'block', fontSize: '0.75rem', fontWeight: '600', 
    color: '#64748b', marginBottom: '8px'
  },
  input: { 
    width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', 
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
  },
  btnPri: { 
    width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', 
    borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', 
    marginTop: '10px'
  },
  footer: { marginTop: '30px', fontSize: '0.9rem', color: '#64748b' },
  link: { color: '#2563eb', fontWeight: '600', cursor: 'pointer' },
  linkSmall: { fontSize: '0.75rem', color: '#2563eb', cursor: 'pointer', fontWeight: '500' }
};

export default Auth;