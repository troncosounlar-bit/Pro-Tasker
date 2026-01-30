import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const TaskItem = ({ task, isOwner, isAdmin, onUpdate, allProfiles, forceOpen, profile }) => {
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(task.description || '');
  
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const isChatLocked = task.is_locked === true;

  const adminProfile = allProfiles?.find(p => p.id === task.created_by); 
  const techProfile = allProfiles?.find(p => p.id === task.assigned_to); 
  const recipient = isAdmin ? techProfile : adminProfile;
  const recipientName = recipient?.full_name?.toUpperCase() || "USUARIO";
  const recipientRole = isAdmin ? (techProfile?.role?.toUpperCase() || "TÉCNICO") : "ADMINISTRACIÓN";

  const statusIcons = {
    'No Realizado': '📌',
    'En proceso': '🚀',
    'Realizado': '✅'
  };

  useEffect(() => {
    if (showModal) fetchComments();
    else setIsExpanded(false);
  }, [showModal]);

  useEffect(() => {
    if (forceOpen) setShowModal(true);
  }, [forceOpen]);

  useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [isExpanded, comments]); 

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });
    if (!error) setComments(data);
    setLoadingComments(false);
  };

  const handleTextareaChange = (e) => {
    setReplyText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
  };

  const handleAdminLockTask = async () => {
    if (!isAdmin) return; // Doble seguridad
    if (!window.confirm("¿Confirmas finalizar y BLOQUEAR el chat para todos?")) return;
    const { error } = await supabase.from('tasks').update({ is_locked: true }).eq('id', task.id);
    if (!error) {
      toast.success("Chat Bloqueado ✅");
      onUpdate();
    } else {
      toast.error("Error al bloquear");
    }
  };

  const handleAdminUnlockTask = async () => {
    if (!isAdmin) return;
    if (!window.confirm("¿Deseas desbloquear la tarea? El chat se habilitará para ambos.")) return;
    const { error } = await supabase.from('tasks').update({ is_locked: false }).eq('id', task.id);
    if (!error) {
      toast.success("Tarea reabierta 🔓");
      onUpdate();
    } else {
      toast.error("Error al reabrir");
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (window.confirm("¿Estás seguro de eliminar esta tarea?")) {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (!error) { toast.success("Tarea eliminada"); onUpdate(); }
    }
  };

  const handleSaveEdit = async () => {
    if (!isAdmin) return;
    const { error } = await supabase.from('tasks').update({ description: editDesc }).eq('id', task.id);
    if (!error) { toast.success("Actualizado"); setIsEditing(false); onUpdate(); }
  };

  const handleStatusChange = async (newStatus) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (!error) {
      await supabase.from('notifications').insert([{
        user_id: task.created_by, 
        title: `${statusIcons[newStatus] || '🔄'} Estado: ${newStatus}`,
        icon: '🔄',
        task_id: task.id,
        read: false
      }]);
      toast.success(`Estado: ${newStatus}`);
      onUpdate();
    }
  };

  const handleSendReply = async () => {
    if (isChatLocked) {
        toast.error("El chat está bloqueado");
        return;
    }
    if (!replyText.trim()) return toast.error("Escribe un mensaje");
    const { error } = await supabase.from('task_comments').insert([{
      task_id: task.id,
      user_id: profile.id,
      content: replyText
    }]);
    if (!error) {
      const targetUserId = isAdmin ? task.assigned_to : task.created_by;
      const senderName = profile?.full_name || "Usuario";
      await supabase.from('notifications').insert([{
        user_id: targetUserId,
        title: `💬 ${senderName} envió un mensaje`,
        icon: isAdmin ? '🏛️' : '👤',
        task_id: task.id,
        read: false
      }]);
      toast.success(`Respuesta enviada`);
      setReplyText('');
      if (textareaRef.current) textareaRef.current.style.height = '50px';
      fetchComments();
    }
  };

  const getRoleTheme = (user) => {
    const isActualAdmin = user?.role?.toUpperCase().includes('ADMIN');
    return {
      color: isActualAdmin ? '#2563eb' : '#10b981', 
      label: isActualAdmin ? 'ADMIN' : (user?.role || 'USUARIO').toUpperCase()
    };
  };

  const prio = { 'Baja': '#86efac', 'Media': '#fcd34d', 'Alta': '#fda4af' }[task.priority] || '#e2e8f0';
  const statusInfo = { 
    'No Realizado': { bg: '#fee2e2', color: '#ef4444' }, 
    'En proceso': { bg: '#fef3c7', color: '#d97706' }, 
    'Realizado': { bg: '#dcfce7', color: '#16a34a' } 
   }[task.status] || { bg: '#f1f5f9', color: '#64748b' };

  const previewComments = comments.slice(-2);

  return (
    <>
      <div style={{...styles.card, border: isChatLocked ? '2px solid #10b981' : '1px solid #f1f5f9'}}>
        <div style={{...styles.prioIndicator, backgroundColor: isChatLocked ? '#10b981' : prio}} />
        <div style={styles.mainContent}>
          <div style={styles.header}>
            <div style={styles.userBadge}>
              <span style={styles.roleTag}>{isAdmin ? "PARA" : "DE"}</span>
              <span style={styles.userName}>{isAdmin ? techProfile?.full_name : (adminProfile?.full_name || "Administración")}</span>
              <span style={styles.userDev}>• {isAdmin ? techProfile?.role : adminProfile?.role}</span>
            </div>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              {isChatLocked && <span style={styles.resolvedBadge}>FINALIZADA ✅</span>}
              <span style={styles.date}>{new Date(task.created_at).toLocaleDateString()}</span>
              {isAdmin && (
                <div style={styles.adminActions}>
                   <button onClick={() => setIsEditing(!isEditing)} style={styles.btnAction}>✏️</button>
                   <button onClick={handleDelete} style={{...styles.btnAction, color: '#ef4444'}}>🗑️</button>
                </div>
              )}
            </div>
          </div>
          
          <h4 style={styles.title}>
            {task.title} {statusIcons[task.status] || '🚀'}
          </h4>

          <div style={styles.metaRow}>
            <span style={{ ...styles.prioBadge, backgroundColor: isChatLocked ? '#10b981' : prio }}>{task.priority}</span>
            <div style={styles.statusContainer}>
              <span style={styles.statusLabel}>Estado:</span>
              {!isAdmin ? (
                <select 
                  value={task.status} 
                  onChange={(e) => handleStatusChange(e.target.value)} 
                  style={{ ...styles.select, color: statusInfo.color, backgroundColor: statusInfo.bg }}
                  disabled={isChatLocked} 
                >
                  <option value="No Realizado">No Realizado</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Realizado">Realizado</option>
                </select>
              ) : (
                <span style={{...styles.statusStatic, color: statusInfo.color}}>{task.status}</span>
              )}
            </div>
          </div>
          <div style={styles.footer}>
            <div style={styles.reqContainer}>
              <span style={styles.reqLabel}>REQUERIMIENTO:</span>
              {isEditing ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={styles.editInput}/>
                  <button onClick={handleSaveEdit} style={styles.btnSave}>Guardar Cambio</button>
                </div>
              ) : (
                <p style={styles.reqText}>{task.description || 'Sin descripción detallada...'}</p>
              )}
            </div>
            {!isEditing && (
              <button 
                onClick={() => { setShowModal(true); }} 
                style={isChatLocked ? {...styles.btnReply, background: '#64748b'} : styles.btnReply}
              >
                {isChatLocked ? 'Ver Chat' : 'Responder'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && createPortal(
        <div style={styles.modalOverlay}>
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .modal-transition { transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
            .content-fade { transition: opacity 0.3s ease-in-out; opacity: 1; }
            .content-hidden { opacity: 0; pointer-events: none; }
          `}</style>
          
          <div className="modal-transition" style={{
            ...styles.modalCard,
            width: isExpanded ? '1100px' : '550px',
            maxWidth: '95vw',
            fontFamily: "'Inter', sans-serif"
          }}>
            
            <div style={styles.leftColumn}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={styles.modalTitle}>Centro de Mensajes</h3>
                    <small style={{ color: getRoleTheme(profile).color, fontWeight: '800' }}>
                      {profile?.full_name} • {profile?.role?.toUpperCase()}
                    </small>
                  </div>
                  <button onClick={() => setShowModal(false)} style={styles.closeX}>&times;</button>
                </div>

                <div style={styles.contextBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                    <small style={styles.contextLabel}>CONSIGNAS ORIGINALES:</small>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                        <small style={styles.contextLabel}>ESTADO ACTUAL:</small>
                        <strong style={{ fontSize: '0.75rem', color: statusInfo.color, fontWeight: '900', letterSpacing: '0.5px' }}>
                            {task.status.toUpperCase()}
                        </strong>
                    </div>
                  </div>
                  
                  <div style={styles.contextDesc}>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', marginBottom: '6px' }}>
                        {task.title} {statusIcons[task.status] || ''}
                      </div>
                      <div style={{ fontWeight: '600', color: '#475569', fontSize: '0.92rem', lineHeight: '1.5' }}>
                        {task.description}
                      </div>
                  </div>
                </div>
              </div>

              <div 
                style={{ padding: '0 30px', flex: 1, overflowY: 'auto' }} 
                className={`no-scrollbar content-fade ${isExpanded ? 'content-hidden' : ''}`}
              >
                <small style={{...styles.inputLabel, marginTop: '10px'}}>ÚLTIMOS MENSAJES</small>
                {previewComments.length > 0 ? previewComments.map(msg => {
                  const msgUser = allProfiles?.find(p => p.id === msg.user_id);
                  const theme = getRoleTheme(msgUser);
                  return (
                    <div key={msg.id} style={{ marginBottom: '12px' }}>
                      <small style={{ color: theme.color, fontWeight: '900', fontSize: '0.65rem', marginBottom: '4px', display: 'block' }}>
                        {msgUser?.full_name?.toUpperCase()} ({theme.label}):
                      </small>
                      <div style={{ ...styles.previewBubble, borderLeftColor: theme.color }}>
                         <p style={{margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#1e293b'}}>{msg.content}</p>
                      </div>
                    </div>
                  );
                }) : <p style={{fontSize:'0.8rem', color:'#94a3b8', textAlign:'center', marginTop: '20px'}}>No hay mensajes aún</p>}
              </div>

              <div style={styles.modalFooterFixed}>
                  {isChatLocked ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={styles.lockedNotice}>🔒 Esta tarea ha sido cerrada por el Administrador.</div>
                      {isAdmin && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button onClick={handleAdminUnlockTask} style={{...styles.btnPrimary, background: '#f59e0b', width: '100%'}}>
                            REABRIR Y DESBLOQUEAR TAREA 🔓
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={styles.inputContainer}>
                        <label style={styles.inputLabel}>
                          RESPONDER A: <span style={{ color: isAdmin ? '#10b981' : '#2563eb' }}>
                            {recipientName} ({recipientRole})
                          </span>
                        </label>
                        <textarea 
                          ref={textareaRef}
                          value={replyText} 
                          onChange={handleTextareaChange} 
                          style={styles.modalTextarea} 
                          placeholder="Escribe tu respuesta..."
                        />
                      </div>
                      <div style={{display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '12px'}}>
                        {isAdmin && (
                          <button onClick={handleAdminLockTask} style={styles.btnTaskComplete}>FINALIZAR Y BLOQUEAR ✅</button>
                        )}
                        <button onClick={handleSendReply} style={styles.btnPrimary}>Enviar Ahora</button>
                      </div>
                    </>
                  )}
              </div>

              <button onClick={() => setIsExpanded(!isExpanded)} style={styles.expandHandle}>
                {isExpanded ? '◀' : '▶'}
              </button>
            </div>

            <div 
              ref={scrollContainerRef}
              style={{
                ...styles.rightColumn,
                width: isExpanded ? '550px' : '0px',
                opacity: isExpanded ? 1 : 0,
                visibility: isExpanded ? 'visible' : 'hidden',
                transition: 'width 0.4s ease, opacity 0.3s ease'
              }} 
              className="no-scrollbar"
            >
              <div style={styles.stickyChatHeader}>HISTORIAL COMPLETO DE LA TAREA</div>
              <div style={{...styles.chatHistoryFull, display: isExpanded ? 'flex' : 'none'}}>
                {loadingComments ? (
                  <p style={{textAlign:'center', color:'#94a3b8'}}>Cargando historial...</p>
                ) : comments.map((msg) => {
                  const msgUser = allProfiles?.find(p => p.id === msg.user_id);
                  const theme = getRoleTheme(msgUser);
                  return (
                    <div key={msg.id} style={{ marginBottom: '12px' }}>
                      <small style={{ color: theme.color, fontWeight: '900', fontSize: '0.65rem', marginBottom: '4px', display: 'block' }}>
                        {msgUser?.full_name?.toUpperCase()} ({theme.label}):
                      </small>
                      <div style={{ ...styles.msgBubble, borderLeftColor: theme.color }}>
                        <p style={styles.msgText}>{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const styles = {
  card: { display: 'flex', background: 'white', borderRadius: '16px', marginBottom: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' },
  prioIndicator: { width: '6px' },
  mainContent: { flex: 1, padding: '20px', minWidth: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '8px' },
  roleTag: { fontSize: '0.6rem', fontWeight: '800', color: '#94a3b8', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' },
  userName: { fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' },
  userDev: { fontSize: '0.75rem', color: '#6366f1', fontWeight: '600' },
  date: { fontSize: '0.75rem', color: '#94a3b8' },
  adminActions: { display: 'flex', gap: '5px' },
  btnAction: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px' },
  title: { margin: '0 0 12px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: '800' },
  metaRow: { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' },
  prioBadge: { padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', color: 'white' },
  statusContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusLabel: { fontSize: '0.8rem', color: '#64748b', fontWeight: '600' },
  statusStatic: { fontSize: '0.85rem', fontWeight: '700' },
  footer: { display: 'flex', alignItems: 'flex-end', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' },
  reqContainer: { flex: 1, minWidth: 0 },
  reqLabel: { fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '5px' },
  reqText: { margin: 0, fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.5', fontWeight: '700', wordBreak: 'break-word' },
  editInput: { width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #6366f1', minHeight: '60px', outline: 'none' },
  btnSave: { padding: '5px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' },
  btnReply: { padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' },
  resolvedBadge: { background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '900' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalCard: { background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxHeight: '90vh', display: 'flex', position: 'relative' },
  leftColumn: { width: '550px', minWidth: '550px', display: 'flex', flexDirection: 'column', position: 'relative', background: 'white', zIndex: 2, borderTopLeftRadius: '24px', borderBottomLeftRadius: '24px' },
  rightColumn: { background: '#f8fafc', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', position: 'relative', zIndex: 1, borderTopRightRadius: '24px', borderBottomRightRadius: '24px' },
  expandHandle: { position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '50px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', zIndex: 10005, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalHeader: { padding: '24px 30px 10px 30px' },
  modalTitle: { margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' },
  closeX: { background: 'none', border: 'none', fontSize: '1.8rem', color: '#94a3b8', cursor: 'pointer' },
  contextBox: { background: '#f1f5f9', padding: '24px', borderRadius: '24px', marginTop: '10px' },
  contextLabel: { fontSize: '0.65rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' },
  contextDesc: { margin: 0 },
  modalFooterFixed: { padding: '20px 30px', background: 'white', borderTop: '1px solid #f1f5f9', borderBottomLeftRadius: '24px' },
  inputContainer: { display: 'flex', flexDirection: 'column' },
  inputLabel: { fontSize: '0.7rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px' },
  modalTextarea: { width: '100%', minHeight: '50px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', fontWeight: '600', resize: 'none', background: '#f8fafc', color: '#1e293b', boxSizing: 'border-box' },
  btnPrimary: { padding: '10px 25px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' },
  btnTaskComplete: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' },
  lockedNotice: { padding: '15px', background: '#f1f5f9', borderRadius: '12px', color: '#64748b', fontWeight: '800', textAlign: 'center' },
  stickyChatHeader: { position: 'sticky', top: 0, background: '#f8fafc', padding: '30px 30px 10px 30px', fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', zIndex: 10 },
  chatHistoryFull: { flexDirection: 'column', gap: '15px', padding: '0 30px 30px 30px' },
  msgBubble: { padding: '16px', background: 'white', border: '1px solid #f1f5f9', borderLeft: '4px solid #ccc', borderRadius: '16px', wordBreak: 'break-word' },
  msgText: { margin: 0, fontSize: '0.9rem', color: '#1e293b', fontWeight: '600' },
  previewBubble: { padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #2563eb', wordBreak: 'break-word' },
  select: { padding: '4px 8px', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', outline: 'none' }
};

export default TaskItem;