# Pro-Tasker: Enterprise Resource Planning (ERP) 🚀
**Plataforma profesional de gestión de talento y monitorización de tareas en tiempo real.**

Pro-Tasker es una solución integral diseñada para optimizar la visibilidad del flujo de trabajo en equipos técnicos. Este proyecto demuestra habilidades avanzadas en la arquitectura de aplicaciones modernas, desde la configuración manual del bundle hasta la resiliencia en la interfaz de usuario.

---

## 🎯 Excelencia Técnica (Architecture Decisions)

Este proyecto fue desarrollado bajo una filosofía de **"Control Total sobre el Stack"**:

* **Custom Boilerplate:** Configuración manual de **Webpack 5** y **Babel 7** (sin dependencias de caja negra), gestionando el ciclo de vida del bundle y la inyección segura de variables mediante `dotenv-webpack`.
* **Resiliencia & Estabilidad:** Implementación de un **Error Boundary** global para capturar fallos en componentes críticos y **React.StrictMode** para asegurar la integridad de las APIs utilizadas.
* **Seguridad de Datos:** Gestión de credenciales mediante variables de entorno (`.env`), garantizando que las API Keys no se expongan en el control de versiones.
* **Performance-First:** Optimización del renderizado mediante `React.memo` en listas de alta densidad y uso de **Skeletons** animados para eliminar el *Layout Shift*.
* **Visualización Avanzada:** Transformación de datos relacionales de **Supabase (PostgreSQL)** en métricas de negocio mediante **Chart.js**.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | ReactJS (Hooks, Memo, StrictMode, Error Boundaries) |
| **Gráficos** | Chart.js & React-Chartjs-2 |
| **Backend/DB** | Supabase (PostgreSQL, Auth, RLS) |
| **Bundling** | Webpack 5 (Custom Config), Babel 7 |
| **Estilos** | CSS3 (3D Transforms, Grid, Flexbox, Keyframes) |
| **Notificaciones** | React Hot Toast |

---

## 🚀 Funcionalidades Destacadas

### 1. Gestión de RRHH & Dashboard (Vista Admin)
* **Productividad Visual:** Dashboard estadístico dinámico para el monitoreo global de tareas.
* **UI Inmersiva:** Flip Cards con efectos 3D para consulta de perfiles y asignación rápida de responsabilidades.
* **Buscador Inteligente:** Filtro de empleados optimizado para alto rendimiento en tiempo real.

### 2. Monitor de Tareas & Feedback
* **Tracking de Estados:** Control visual de progreso (Realizado/En Proceso/No Realizado) con código de colores.
* **Comunicación Crítica:** Sistema de feedback bidireccional y modales de seguridad para confirmación de acciones irreversibles (bajas).

---

## 📈 Roadmap del Proyecto

### 🟩 Etapa 1: Infraestructura (100% Completado)
- [x] Configuración manual de Webpack/Babel.
- [x] Inyección de variables de entorno con `dotenv-webpack`.
- [x] Conexión robusta con Supabase Auth y Database.

### 🟨 Etapa 2: UI/UX & Refactor (100% Completado)
- [x] Modularización atómica de componentes.
- [x] Implementación de **Skeletons** de carga y memoización selectiva.
- [x] Integración de **Error Boundaries** para resiliencia de la UI.

### 🟦 Etapa 3: Mejoras de Datos (100% Completado)
- [x] Dashboard estadístico con Chart.js.
- [x] Lógica de feedback y actualización de estados en tiempo real.

### ⬜ Etapa 4: Optimización Final (Siguiente)
- [ ] Implementación de Unit Testing (Jest/React Testing Library).
- [ ] Configuración de CI/CD para despliegue automatizado.

---

## ⚙️ Instalación y Configuración

1. **Clonar repositorio:**
   bash
   git clone [tu-url-de-repo]


2. **Instalar dependencias:**
bash
npm install


3. **Variables de Entorno (.env):**
Crea un archivo `.env` en la raíz (asegúrate de que esté en tu `.gitignore`):
env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima


4. **Lanzar entorno de desarrollo:**
bash
npm start


5. **Compilar para Producción:**
bash
npm run build


*La aplicación se sirve en `http://localhost:3000` con soporte para Hot Module Replacement (HMR).*