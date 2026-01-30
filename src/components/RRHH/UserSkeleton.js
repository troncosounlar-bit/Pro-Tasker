import React from 'react';

const UserSkeleton = () => {
  return (
    <div style={styles.card}>
      <div style={styles.avatar} />
      <div style={styles.lineSmall} />
      <div style={styles.lineTiny} />
      <div style={styles.button} />
      <div style={styles.button} />
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    animation: 'pulse 1.5s infinite ease-in-out', // Animación de pulso
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    marginBottom: '15px',
  },
  lineSmall: {
    width: '80%',
    height: '16px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  lineTiny: {
    width: '60%',
    height: '12px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  button: {
    width: '90%',
    height: '38px',
    backgroundColor: '#e2e8f0',
    borderRadius: '8px',
    marginBottom: '10px',
  },
};

// Necesitarás agregar esta animación CSS globalmente si no la tienes
// Por ejemplo, en tu public/index.html o un archivo CSS importado.
/*
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}
*/

export default UserSkeleton;