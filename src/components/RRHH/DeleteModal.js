import React from 'react';

const DeleteModal = ({ isOpen, user, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      {/* Detenemos la propagación para que al hacer clic en el cuadro blanco no se cierre */}
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.iconWrapper}>
          <div style={styles.icon}>⚠️</div>
        </div>
        
        <h3 style={styles.title}>¿Confirmar baja definitiva?</h3>
        
        <p style={styles.text}>
          Estás por dar de baja a <span style={styles.userName}>{user?.full_name}</span>.<br />
          Esta acción eliminará su perfil de la base de datos de forma permanente y ya no podrá acceder al sistema.
        </p>

        <div style={styles.actions}>
          <button onClick={onCancel} style={styles.btnCancel}>
            No, mantener
          </button>
          <button onClick={onConfirm} style={styles.btnConfirm}>
            Sí, dar de baja
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes modalPop {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Un azul muy oscuro con transparencia
    backdropFilter: 'blur(8px)', // Desenfoque de fondo más elegante
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999 // Aseguramos que esté por encima de todo
  },
  modal: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '420px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    animation: 'modalPop 0.25s ease-out forwards',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  iconWrapper: {
    backgroundColor: '#fff1f2',
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto'
  },
  icon: { 
    fontSize: '2.5rem' 
  },
  title: { 
    margin: '0 0 12px 0', 
    color: '#0f172a', 
    fontSize: '1.5rem', 
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  text: { 
    color: '#64748b', 
    fontSize: '0.95rem', 
    marginBottom: '30px', 
    lineHeight: '1.6' 
  },
  userName: {
    color: '#1e293b',
    fontWeight: '700',
    borderBottom: '2px solid #fda4af'
  },
  actions: { 
    display: 'flex', 
    gap: '12px' 
  },
  btnCancel: { 
    flex: 1, 
    padding: '14px', 
    borderRadius: '12px', 
    border: '1px solid #e2e8f0', 
    background: 'white', 
    color: '#64748b',
    fontWeight: '700', 
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  },
  btnConfirm: { 
    flex: 1, 
    padding: '14px', 
    borderRadius: '12px', 
    border: 'none', 
    background: '#ef4444', 
    color: 'white', 
    fontWeight: '700', 
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
    transition: 'all 0.2s ease'
  }
};

export default DeleteModal;