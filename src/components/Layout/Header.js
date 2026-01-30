import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const Header = ({
  profile,
  onSignOut,
  notifications = [],
  notificationsCount = 0,
  onMarkRead,
  onNotificationClick,
  searchTerm,
  setSearchTerm,
  onProfileUpdate 
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const notifRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    avatar_url: ''
  });

  const getStatusIcon = (notifIcon, title) => {
    if (title.includes('No Realizado')) return '📌';
    if (title.includes('En proceso')) return '🚀';
    if (title.includes('Estado: Realizado')) return '✅';
    return notifIcon || '🔔';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    if (profile && showProfileModal) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile, showProfileModal]);

  const getVividRainbowColor = (name) => {
    const rainbowColors = ['#FF4D4D', '#FF9F43', '#FAD02E', '#2ECC71', '#3498DB', '#9B59B6', '#F368E0'];
    if (!name) return rainbowColors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return rainbowColors[Math.abs(hash) % rainbowColors.length];
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast.success("Imagen cargada. Recuerda guardar cambios.");
    } catch (error) {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          avatar_url: formData.avatar_url,
          last_sign_in_at: new Date().toISOString() // Actualizamos actividad al guardar
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success("Perfil actualizado con éxito");
      setShowProfileModal(false);
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const dynamicBg = getVividRainbowColor(profile?.full_name);

  return (
    <header style={styles.header}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          .notif-item:hover { background-color: #f8fafc !important; }
          .search-header:focus { border-color: #2563eb !important; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); background: white !important; }
          .notif-list::-webkit-scrollbar { width: 6px; }
          .notif-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `}
      </style>

      <div style={styles.logoContainer}>
        <img src="/LogoPT.png" alt="Pro-Tasker Logo" style={styles.logoImg} />
      </div>

      {profile?.role === 'Admin' && (
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o rol de empleado..."
            style={styles.searchInput}
            className="search-header"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        <div style={styles.notifWrapper} ref={notifRef}>
          <button
            style={styles.notifBtn}
            onClick={() => {
              const newState = !notifOpen;
              setNotifOpen(newState);
              if (newState && notificationsCount > 0 && onMarkRead) {
                onMarkRead();
              }
            }}
          >
            🔔
            {notificationsCount > 0 && (
              <span style={styles.badge}>{notificationsCount}</span>
            )}
          </button>

          {notifOpen && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownHeader}>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>Notificaciones</span>
                {notificationsCount > 0 && <span style={styles.unreadTag}>{notificationsCount} nuevas</span>}
              </div>

              <div style={styles.notifList} className="notif-list">
                {notifications.length === 0 ? (
                  <div style={styles.empty}>No hay novedades por aquí</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="notif-item"
                      onClick={() => {
                        setNotifOpen(false);
                        if (onNotificationClick) onNotificationClick(n.task_id); 
                      }}
                      style={{
                        ...styles.notifItem,
                        backgroundColor: n.read ? 'transparent' : '#f0f7ff',
                        borderLeft: n.read ? '4px solid transparent' : '4px solid #2563eb'
                      }}
                    >
                      <div style={styles.notifIconContainer}>
                        {getStatusIcon(n.icon, n.title)}
                      </div>
                      <div style={styles.notifContent}>
                        <p style={styles.notifText}>{n.title}</p>
                        <span style={styles.notifTime}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={styles.userInfoWrapper} onClick={() => setShowProfileModal(true)}>
          <div style={styles.textData}>
            <div style={styles.userName}>{profile?.full_name}</div>
            <div style={styles.userRole}>{profile?.role}</div>
          </div>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="profile" style={styles.avatarImg} />
          ) : (
            <div style={{ ...styles.avatarCircle, backgroundColor: dynamicBg }}>
              {getInitials(profile?.full_name)}
            </div>
          )}
        </div>
        <button onClick={onSignOut} style={styles.logoutBtn}>Cerrar Sesión</button>
      </div>

      {showProfileModal && (
        <div style={styles.modalOverlay}>
          <form style={styles.modalCard} onSubmit={handleUpdateProfile}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontWeight: '800' }}>Configuración de Perfil</h3>
              <button type="button" onClick={() => setShowProfileModal(false)} style={styles.closeX}>&times;</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.avatarUploadContainer}>
                <div style={{
                  ...styles.largeAvatar,
                  backgroundColor: formData.avatar_url ? '#f1f5f9' : getVividRainbowColor(formData.full_name)
                }}>
                  {formData.avatar_url ? 
                    <img src={formData.avatar_url} alt="Preview" style={styles.fullImg} /> 
                    : getInitials(formData.full_name)
                  }
                  <label htmlFor="avatarInput" style={styles.editIconBadge}>
                    {uploading ? '...' : '✎'}
                  </label>
                </div>
                <input id="avatarInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                <p style={styles.avatarHint}>Toca el lápiz para cambiar tu foto</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nombre Completo</label>
                <input 
                  style={styles.input} 
                  value={formData.full_name} 
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Teléfono de Contacto</label>
                <input 
                  style={styles.input} 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Domicilio</label>
                <input 
                  style={styles.input} 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowProfileModal(false)} style={styles.btnSec}>Cancelar</button>
              <button type="submit" style={styles.btnPri} disabled={uploading}>
                {uploading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

// ... (Los estilos se mantienen igual a tu versión original ya que están perfectos)
const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '80px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000, fontFamily: "'Inter', sans-serif" },
    logoContainer: { width: '220px', display: 'flex', alignItems: 'center' },
    logoImg: { width: '220px', height: '60px', objectFit: 'contain' },
    searchContainer: { flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px' },
    searchInput: { width: '100%', maxWidth: '450px', padding: '12px 18px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s' },
    userInfoWrapper: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
    textData: { textAlign: 'right' },
    userName: { fontWeight: 'bold', fontSize: '0.85rem', color: '#0f172a' },
    userRole: { fontSize: '0.65rem', color: '#2563eb', fontWeight: '800', textTransform: 'uppercase', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px' },
    avatarCircle: { width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000', fontWeight: '800', fontSize: '0.9rem' },
    avatarImg: { width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #000', objectFit: 'cover' },
    logoutBtn: { background: '#fff1f2', color: '#e11d48', border: '1px solid #fda4af', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', transition: '0.2s' },
    notifWrapper: { position: 'relative' },
    notifBtn: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', position: 'relative', padding: '5px' },
    badge: { position: 'absolute', top: '0', right: '0', background: '#ef4444', color: '#fff', minWidth: '18px', height: '18px', borderRadius: '10px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', fontWeight: 'bold', padding: '0 4px' },
    dropdown: { position: 'absolute', top: '55px', right: '-10px', width: '360px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)', zIndex: 1100, overflow: 'hidden' },
    dropdownHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', alignItems: 'center', background: '#f8fafc' },
    unreadTag: { background: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontWeight: '900', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase' },
    notifList: { maxHeight: '450px', overflowY: 'auto' },
    notifItem: { padding: '16px 20px', display: 'flex', gap: '15px', transition: '0.2s', borderBottom: '1px solid #f8fafc', cursor: 'pointer', alignItems: 'center' },
    notifIconContainer: { width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
    notifContent: { flex: 1 },
    notifText: { margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: '1.4', fontWeight: '700' },
    notifTime: { fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', display: 'block', fontWeight: '600' },
    empty: { padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalCard: { background: 'white', width: '100%', maxWidth: '440px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    modalHeader: { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' },
    modalBody: { padding: '24px' },
    modalFooter: { padding: '20px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' },
    avatarUploadContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' },
    largeAvatar: { width: '100px', height: '100px', borderRadius: '50%', border: '3.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
    fullImg: { width: '100%', height: '100%', objectFit: 'cover' },
    editIconBadge: { position: 'absolute', bottom: '2px', right: '2px', background: '#000', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff', fontSize: '0.9rem' },
    avatarHint: { fontSize: '0.7rem', color: '#64748b', marginTop: '10px', fontWeight: '500' },
    field: { marginBottom: '18px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.025em' },
    input: { width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e2e8f0', outline: 'none', transition: '0.2s', boxSizing: 'border-box', fontSize: '0.95rem', background: '#f8fafc' },
    btnPri: { background: '#2563eb', color: 'white', padding: '14px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: '0.2s' },
    btnSec: { background: 'white', border: '1.5px solid #e2e8f0', padding: '14px 24px', borderRadius: '14px', cursor: 'pointer', color: '#475569', fontWeight: '600' },
    closeX: { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#94a3b8', lineHeight: '1' }
};

export default Header;