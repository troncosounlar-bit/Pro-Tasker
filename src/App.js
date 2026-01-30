import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import Auth from './components/Auth';
import Header from './components/Layout/Header';
import UserCard from './components/RRHH/UserCard';
import UserSkeleton from './components/RRHH/UserSkeleton';
import StatsChart from './components/RRHH/StatsChart';
import TaskItem from './components/Tasks/TaskItem';
import DeleteModal from './components/RRHH/DeleteModal';
import toast, { Toaster } from 'react-hot-toast';

const playNotificationSound = () => {
  if (document.visibilityState === 'visible') {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
  }
};

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [chartFilter, setChartFilter] = useState(null); 
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // 1. Manejo de Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setChartFilter(null); 
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Carga Inicial de Datos
  useEffect(() => {
    if (session) {
      const updateLastActivity = async () => {
        await supabase
          .from('profiles')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', session.user.id);
      };

      updateLastActivity();
      fetchUserData();
      fetchUnreadNotifications();
      fetchNotifications();
    }
  }, [session]);

  // 3. SUSCRIPCIONES EN TIEMPO REAL (Notificaciones + Tareas)
  useEffect(() => {
    if (!session?.user?.id) return;

    // Canal para Notificaciones Privadas
    const notificationChannel = supabase
      .channel(`private-notifications-${session.user.id}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${session.user.id}` 
        },
        (payload) => {
          playNotificationSound();
          fetchUnreadNotifications();
          fetchNotifications();
          toast(payload.new.title, { 
            icon: payload.new.icon || '🔔',
            style: { borderRadius: '12px', background: '#1e293b', color: '#fff', zIndex: 10000 }
          });
        }
      )
      .subscribe();

    // Canal para cambios en Tareas (Permite que el Admin vea cambios sin refresh)
    const tasksChannel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { 
          event: '*', // Escucha INSERT, UPDATE y DELETE
          schema: 'public', 
          table: 'tasks' 
        }, 
        () => {
          // Refrescamos datos silenciosamente cuando hay cambios en la DB
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [session?.user?.id]);

  const fetchUnreadNotifications = async () => {
    if (!session?.user?.id) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('read', false);
    setNotificationsCount(count || 0);
  };

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setNotifications(data || []);
  };

  const markNotificationsAsRead = async () => {
    if (!session?.user?.id) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false);
    setNotificationsCount(0);
    fetchNotifications();
  };

  const handleNotificationClick = (taskId) => {
    if (!taskId) return;
    setActiveTaskId(null); 
    setTimeout(() => {
      setActiveTaskId(taskId); 
      const element = document.getElementById(`task-${taskId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.transition = 'all 0.5s ease';
        element.style.transform = 'scale(1.02)';
        element.style.zIndex = "10";
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            setTimeout(() => setActiveTaskId(null), 1000);
        }, 800);
      }
    }, 150);
  };

  const fetchUserData = async () => {
    if (!session?.user?.id) return;
    // Quitamos el setLoading(true) para que el refresh en tiempo real sea invisible al usuario
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(profileData);

      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileData.role !== 'Admin') {
        query = query.eq('assigned_to', session.user.id);
      }

      const { data: tasksData } = await query;
      setTasks(tasksData || []);

      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('last_sign_in_at', { ascending: false });
      setAllProfiles(users || []);
    } catch (err) {
      console.error('Error al sincronizar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await supabase.from('tasks').delete().or(`assigned_to.eq.${userToDelete.id},created_by.eq.${userToDelete.id}`);
      await supabase.from('profiles').delete().eq('id', userToDelete.id);
      toast.success('Empleado eliminado');
      fetchUserData();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const getFilteredUsers = () => {
    return allProfiles
      .filter(u => u.id !== session.user.id)
      .filter(u => {
        const term = searchTerm.toLowerCase();
        return (
          u.full_name?.toLowerCase().includes(term) || 
          u.role?.toLowerCase().includes(term)
        );
      });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchPrio = filterPriority === 'Todas' || task.priority === filterPriority;
    const matchStatus = filterStatus === 'Todos' || task.status === filterStatus;
    
    let matchChart = true;
    const isAdmin = profile?.role === 'Admin';

    if (isAdmin && chartFilter) {
      if (chartFilter === 'Sin Abrir') {
        matchChart = !task.status || (task.status !== 'Realizado' && task.status !== 'En proceso' && task.status !== 'No Realizado');
      } else {
        matchChart = task.status === chartFilter;
      }
    }
    
    return matchPrio && matchStatus && matchChart;
  });

  if (!session) return <Auth />;

  const displayedUsers = getFilteredUsers();

  return (
    <div style={styles.container}>
      <Toaster position="top-center" containerStyle={{ zIndex: 10001 }} />

      <Header
        profile={profile}
        onSignOut={() => supabase.auth.signOut()}
        notifications={notifications}
        notificationsCount={notificationsCount}
        onMarkRead={markNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
        setSearchTerm={setSearchTerm}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        user={userToDelete}
        onConfirm={handleDeleteUser}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <main style={styles.main}>
        {profile?.role === 'Admin' && (
          <div style={styles.adminDashboard}>
            <div style={styles.userSection}>
              <h2 style={styles.sectionTitle}>Gestión de Recursos Humanos</h2>
              <div style={styles.userGrid}>
                {loading ? (
                  [...Array(4)].map((_, i) => <UserSkeleton key={i} />)
                ) : displayedUsers.length > 0 ? (
                  displayedUsers.map(u => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onTaskCreated={fetchUserData}
                      onUserDeleted={() => {
                        setUserToDelete(u);
                        setIsDeleteModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div style={styles.noResults}>
                    <p>No se encontraron resultados.</p>
                  </div>
                )}
              </div>
            </div>

            <aside style={styles.statsSection}>
              <h2 style={styles.sectionTitle}>Métricas</h2>
              <StatsChart 
                tasks={tasks} 
                onFilterChange={setChartFilter} 
                activeFilter={chartFilter} 
              />
            </aside>
          </div>
        )}

        <div style={styles.taskListHeader}>
          <h2 style={styles.sectionTitle}>Tareas Designadas</h2>
          {profile?.role === 'Admin' && chartFilter && (
            <button onClick={() => setChartFilter(null)} style={styles.clearFilterBtn}>
              Filtrado por:&nbsp;<b>{chartFilter}</b>&nbsp;&nbsp;✕
            </button>
          )}
        </div>

        <div style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <div style={styles.emptyMsg}>
              {profile?.role === 'Admin' && chartFilter 
                ? `No hay tareas en estado "${chartFilter}" actualmente.` 
                : "No hay tareas pendientes en tu lista."}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div id={`task-${task.id}`} key={task.id}>
                <TaskItem
                  task={task}
                  isOwner={task.assigned_to === session.user.id}
                  isAdmin={profile?.role === 'Admin'}
                  onUpdate={fetchUserData}
                  allProfiles={allProfiles}
                  forceOpen={activeTaskId === task.id}
                  profile={profile}
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  main: { padding: '30px', maxWidth: '1400px', margin: '0 auto' },
  adminDashboard: { display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '40px' },
  userSection: { flex: '1 1 600px', minWidth: '0' },
  statsSection: { flex: '0 0 350px', position: 'sticky', top: '20px', alignSelf: 'flex-start' },
  sectionTitle: { fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', borderBottom: '3px solid #2563eb', display: 'inline-block', paddingBottom: '5px', marginBottom: '20px' },
  userGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  noResults: { gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', color: '#64748b' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  taskListHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  clearFilterBtn: { padding: '8px 16px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', fontWeight: '500' },
  emptyMsg: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }
};

export default App;