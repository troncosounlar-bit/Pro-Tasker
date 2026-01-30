import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const StatsChart = ({ tasks, onFilterChange, activeFilter }) => {
  // Calculamos las estadísticas basadas en las tareas recibidas
  const stats = {
    realizado: tasks.filter(t => t.status === 'Realizado').length,
    proceso: tasks.filter(t => t.status === 'En proceso').length,
    noRealizado: tasks.filter(t => t.status === 'No Realizado').length,
    sinGestionar: tasks.filter(t => 
      !t.status || (t.status !== 'Realizado' && t.status !== 'En proceso' && t.status !== 'No Realizado')
    ).length,
  };

  const labels = ['Realizado', 'En proceso', 'No Realizado', 'Sin Abrir'];
  const displayLabels = ['Realizado ✅', 'En proceso 🚀', 'No Realizado 📌', 'Sin Abrir 🔔'];
  
  // Colores consistentes con el resto de la App
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

  const data = {
    labels: displayLabels,
    datasets: [
      {
        label: '# de Tareas',
        data: [stats.realizado, stats.proceso, stats.noRealizado, stats.sinGestionar],
        backgroundColor: colors,
        // Resaltado de borde si está activo
        borderWidth: (context) => {
          const label = labels[context.dataIndex];
          return activeFilter === label ? 3 : 1;
        },
        // Color de borde dinámico
        borderColor: (context) => {
          const index = context.dataIndex;
          const label = labels[index];
          return activeFilter === label ? colors[index] : '#ffffff'; 
        },
        // Efecto de explosión de la pieza seleccionada
        offset: (context) => {
          const label = labels[context.dataIndex];
          return activeFilter === label ? 20 : 0;
        },
        hoverOffset: 15
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 20 
    },
    // Manejo del clic en las porciones del gráfico
    onClick: (event, elements) => {
      if (elements.length > 0 && onFilterChange) {
        const index = elements[0].index;
        const selectedLabel = labels[index];
        // Si clickeas la misma, se limpia. Si no, cambia al nuevo filtro.
        onFilterChange(activeFilter === selectedLabel ? null : selectedLabel);
      }
    },
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          padding: 20,
          font: { weight: '700', size: 11, family: "'Inter', sans-serif" },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: { 
        display: true, 
        text: 'MÉTRICAS DE RENDIMIENTO',
        font: { size: 14, weight: '800' },
        color: '#1e293b',
        padding: { bottom: 10 }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        padding: 12,
        borderRadius: 12,
        displayColors: true,
        callbacks: {
          label: (context) => ` ${context.raw} Tareas registradas`
        }
      }
    },
  };

  return (
    <div style={styles.container}>
      <div style={{ height: '280px', position: 'relative', width: '100%' }}>
        <Pie data={data} options={options} />
      </div>

      {/* Botón de limpieza dinámico (Solo aparece si hay filtro activo) */}
      {activeFilter && (
        <button 
          onClick={() => onFilterChange(null)}
          style={{
            ...styles.clearBtn,
            boxShadow: `0 8px 20px ${colors[labels.indexOf(activeFilter)]}33`,
            borderColor: colors[labels.indexOf(activeFilter)],
            color: colors[labels.indexOf(activeFilter)]
          }}
        >
          Quitar Filtro:&nbsp;<strong>{activeFilter}</strong>&nbsp;&nbsp;✕
        </button>
      )}

      {/* Banner informativo de tareas pendientes */}
      {!activeFilter && stats.sinGestionar > 0 && (
        <div style={styles.alertBanner}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span> 
          <span>{stats.sinGestionar} tareas pendientes de gestión</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '380px',
    margin: '0 auto',
    padding: '25px',
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  clearBtn: {
    marginTop: '20px',
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderRadius: '14px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    border: '2px solid',
    width: '90%'
  },
  alertBanner: {
    marginTop: '15px',
    padding: '12px',
    background: '#fef2f2', // Un tono rojizo muy suave
    borderRadius: '14px',
    fontSize: '0.75rem',
    color: '#991b1b',
    textAlign: 'center',
    fontWeight: '700',
    border: '1px solid #fee2e2',
    width: '90%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }
};

export default StatsChart;