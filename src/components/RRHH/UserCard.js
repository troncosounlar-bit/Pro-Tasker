import React, { useState, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const UserCard = ({ user, onTaskCreated, onUserDeleted }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState(''); 
  const [selectedPrio, setSelectedPrio] = useState('Baja');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formateo de Fecha de Alta (Antigüedad)
  const formatJoinDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formateo de fecha de actividad
  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Sin actividad reciente';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha no disponible';
      
      const ahora = new Date();
      const diferenciaDif = (ahora - date) / 1000;

      if (diferenciaDif < 60) return 'Activo ahora';
      if (diferenciaDif < 3600) return `Hace ${Math.floor(diferenciaDif / 60)} min`;

      return date.toLocaleString('es-AR', {
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false
      }) + ' hs';
    } catch (e) { 
      return 'Error de formato'; 
    }
  };

  const getVividRainbowColor = (name) => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb7185', '#00cec9', '#fdcb6e'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleFlip = (newMode) => {
    setMode(newMode);
    setIsFlipped(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const title = e.target.title.value.trim();
    const description = e.target.description.value.trim();

    const { data: { session } } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      toast.error("Error de sesión. Reingresa.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .insert([{ 
          title, 
          description, 
          priority: selectedPrio, 
          assigned_to: user.id, 
          status: 'Pendiente', 
          created_by: adminId 
        }]);

      if (taskError) throw taskError;

      toast.success("Tarea asignada correctamente");
      setIsFlipped(false);
      onTaskCreated(); 
      e.target.reset();
      setSelectedPrio('Baja');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = () => {
    onUserDeleted(user.id);
    setShowDeleteModal(false);
    setIsFlipped(false);
  };

  const getPrioColor = (p) => {
    const colors = { 'Baja': '#2dc765', 'Media': '#facf41', 'Alta': '#cf2d40' };
    return colors[p] || '#e2e8f0';
  };

  const dynamicBg = getVividRainbowColor(user.full_name);

  return (
    <div style={styles.cardContainer}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes modalIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalIcon}>⚠️</div>
            <h3 style={styles.modalTitle}>¿Confirmar baja?</h3>
            <p style={styles.modalText}>Estás por dar de baja a <strong>{user.full_name}</strong>.</p>
            <div style={styles.modalButtons}>
              <button onClick={() => setShowDeleteModal(false)} style={styles.btnSec}>Cancelar</button>
              <button onClick={confirmDelete} style={styles.btnDangerSolid}>Sí, dar de baja</button>
            </div>
          </div>
        </div>
      )}

      <div style={{...styles.cardInner, transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', position: 'relative'}}>
        
        {/* CARA FRONTAL */}
        <div style={{...styles.cardFace, ...styles.cardFront, visibility: isFlipped ? 'hidden' : 'visible', position: isFlipped ? 'absolute' : 'relative'}}>
          <div style={styles.avatarWrapper}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="user" style={styles.avatarImg} onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/80?text=PT"}}/>
            ) : (
              <div style={{...styles.avatarCircle, backgroundColor: dynamicBg}}>{getInitials(user.full_name)}</div>
            )}
          </div>
          <div style={styles.centerInfo}>
            <h3 style={styles.userName}>{user.full_name}</h3>
            <span style={styles.roleLabel}>{user.role}</span>
          </div>
          <div style={styles.buttonColumn}>
            <button onClick={() => handleFlip('info')} style={styles.btnSec}>Ver Detalles</button>
            <button onClick={() => handleFlip('assign')} style={styles.btnPri}>Asignar Tarea</button>
          </div>
        </div>

        {/* CARA TRASERA */}
        <div style={{...styles.cardFace, ...styles.cardBack, visibility: isFlipped ? 'visible' : 'hidden', position: isFlipped ? 'relative' : 'absolute'}}>
          <div style={styles.backContent}>
            {mode === 'info' ? (
              <>
                <h4 style={styles.backTitle}>Información del Perfil</h4>
                <div style={styles.infoGroup}>
                    <p style={styles.infoItem}><strong>📧 Email:</strong><br/>{user.email || 'No disponible'}</p>
                    <p style={styles.infoItem}><strong>📞 Tel:</strong><br/>{user.phone || 'No disponible'}</p>
                    <p style={styles.infoItem}><strong>🏠 Dir:</strong><br/>{user.address || 'No cargada'}</p>
                    <p style={styles.infoItem}><strong>📅 Fecha de Alta:</strong><br/>{formatJoinDate(user.created_at)}</p>
                    
                    <div style={styles.loginDivider}></div>
                    
                    <p style={styles.loginStatusText}><strong>🕒 ÚLTIMA ACTIVIDAD:</strong></p>
                    <p style={{margin: 0, fontSize: '0.85rem', color: '#2563eb', fontWeight: '800'}}>
                      {formatLastActivity(user.last_sign_in_at)}
                    </p>
                </div>
                <div style={styles.buttonColumn}>
                  <button onClick={() => setIsFlipped(false)} style={styles.btnSec}>Volver</button>
                  <button onClick={() => setShowDeleteModal(true)} style={styles.btnDanger}>Dar de Baja</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleAssign} style={styles.formInside}>
                <h4 style={styles.backTitle}>Nueva Tarea</h4>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Asunto</label>
                  <input name="title" placeholder="¿Qué debe hacer?" required style={styles.inputStyle} disabled={isSubmitting}/>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Instrucciones</label>
                  <textarea name="description" placeholder="Detalles de la tarea..." required style={styles.textareaStyle} disabled={isSubmitting}/>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Prioridad</label>
                  <select 
                    value={selectedPrio} 
                    onChange={(e) => setSelectedPrio(e.target.value)}
                    style={{...styles.prioSelect, borderLeft: `8px solid ${getPrioColor(selectedPrio)}`}}
                    disabled={isSubmitting}
                  >
                    <option value="Baja">🟢 Baja</option>
                    <option value="Media">🟡 Media</option>
                    <option value="Alta">🔴 Alta</option>
                  </select>
                </div>
                <div style={styles.buttonColumnBottom}>
                  <button type="submit" style={styles.btnPri} disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Tarea'}
                  </button>
                  <button type="button" onClick={() => setIsFlipped(false)} style={styles.btnSec}>Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  cardContainer: { width: '100%', perspective: '1200px', marginBottom: '20px', fontFamily: "'Inter', sans-serif" },
  cardInner: { width: '100%', transition: '0.6s', transformStyle: 'preserve-3d' },
  cardFace: { inset: 0, backfaceVisibility: 'hidden', background: 'white', borderRadius: '20px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' },
  cardFront: { padding: '30px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  cardBack: { padding: '20px', transform: 'rotateY(180deg)', top: 0 },
  avatarWrapper: { marginBottom: '15px' },
  avatarCircle: { width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.6rem', color: '#000', border: '3.5px solid #000' },
  avatarImg: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3.5px solid #000' },
  centerInfo: { textAlign: 'center', marginBottom: '25px' },
  userName: { fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0', color: '#0f172a', letterSpacing: '-0.02em' },
  roleLabel: { color: '#2563eb', fontWeight: '800', fontSize: '0.65rem', background: '#eff6ff', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', border: '1px solid #dbeafe' },
  formInside: { display: 'flex', flexDirection: 'column' },
  fieldGroup: { marginBottom: '12px', width: '100%' },
  fieldLabel: { display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' },
  inputStyle: { width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  textareaStyle: { width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.85rem', color: '#1e293b', height: '70px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  prioSelect: { width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', color: '#1e293b', fontWeight: '700', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  buttonColumn: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '10px' },
  buttonColumnBottom: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px', width: '100%' },
  btnPri: { background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' },
  btnSec: { background: '#fff', border: '1.5px solid #e2e8f0', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', color: '#475569', fontFamily: 'inherit', fontSize: '0.85rem' },
  btnDanger: { background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fda4af', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' },
  btnDangerSolid: { background: '#e11d48', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' },
  backTitle: { textAlign: 'center', marginBottom: '15px', fontSize: '1rem', fontWeight: '700', color: '#0f172a' },
  infoGroup: { background: '#f8fafc', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #f1f5f9' },
  infoItem: { fontSize: '0.85rem', margin: '8px 0', color: '#334155', lineHeight: '1.4' },
  loginDivider: { height: '1px', background: '#e2e8f0', margin: '12px 0' },
  loginStatusText: { fontSize: '0.6rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  backContent: { display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalBox: { background: 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', animation: 'modalIn 0.3s ease-out' },
  modalIcon: { fontSize: '3rem', marginBottom: '15px' },
  modalTitle: { margin: '0 0 10px 0', color: '#0f172a', fontWeight: '800' },
  modalText: { color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '25px' },
  modalButtons: { display: 'flex', gap: '12px', justifyContent: 'center' }
};

export default memo(UserCard);