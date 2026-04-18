<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Iterum Banner" width="800" />
  <h1>ITERUM</h1>
  <p><strong>Productividad para el 1% que busca la excelencia</strong></p>
</div>

---

## 🚀 Sobre Iterum

Iterum no es solo otra aplicación de lista de tareas. Es un sistema de forja personal diseñado para convertir la intención en disciplina y el progreso en maestría. Inspirado en el estoicismo y la psicología del alto rendimiento, Iterum te ayuda a "ordenar la casa" para luego conquistar tus objetivos más ambiciosos.

## ✨ Características Principales

- **Arquitectura Local-First real:** Puedes abrir ITERUM y usarla inmediatamente sin registrarte. Tareas, hábitos, objetivos y diario quedan guardados en `localStorage`.
- **Cuenta opcional para sincronizar:** Si decides iniciar sesión, ITERUM conecta con Supabase y migra tu progreso local para que tus datos viajen contigo entre dispositivos.
- **Sincronización en Tiempo Real:** Integración completa con Supabase (Auth & Database). Tus datos viven en PostgreSQL con políticas RLS *(Row Level Security)*.
- **Jugo Sensorial (Sensory UX):** La app recompensa cada acción positiva con un motor de feedback propio (sonidos sintetizados vía Web Audio API, animaciones interactivas usando Framer Motion, micro haptics y explosiones de confetti) optimizado para no sumar un solo KB de dependencias innecesarias.
- **Gestión de Hábitos:** Seguimiento cuantitativo y cualitativo de tus rutinas diarias con sistema de rachas (streaks) y recordatorios predictivos.
- **Objetivos y Hitos:** Define metas a largo plazo y divídelas en pasos accionables, acumulando progresión de forma gamificada.
- **Modo Foco:** Interfaz inmersiva para bloquear distracciones durante la ejecución de las tareas críticas.
- **Diario y Cierre de Día:** Espacio para la introspección nocturna guiada.

## 🛠️ Tech Stack & Ingeniería

- **Frontend:** React 19 + TypeScript + Vite 6
- **Animaciones y Estilos:** Tailwind CSS 4 + Lucide Icons + Framer Motion
- **Estado Global:** Zustand (Stores segmentados para hábitos, tareas y objetivos + persistence middleware)
- **Backend & DB:** Supabase (PostgreSQL, Auth, RLS)
- **Confiabilidad:** ErrorBoundaries globales, Null-safety stricto para Supabase checks, Toasts centralizados para sincronización.
- **DevOps y QA:** ESLint 9 + Prettier + Vitest + Husky. Despliegue en Vercel con integración continua.

## 💻 Desarrollo Local

### Requisitos
- Node.js (v18+)
- npm / yarn / pnpm

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Juno002/ITERUM.git
   cd ITERUM
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el Entorno (opcional):**
   Si solo quieres usar ITERUM en modo local, puedes saltarte este paso.
   Si quieres habilitar registro, login y sincronización en la nube, crea un archivo `.env` en la raíz copiando `.env.example` y añade tus claves de Supabase.
   ```bash
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## ☁️ Modo Local y Sincronización

- **Sin cuenta:** ITERUM funciona completamente en local y guarda el progreso en el navegador.
- **Con cuenta:** al iniciar sesión, la app carga tus datos de Supabase y usa sincronización cloud.
- **Migración local -> nube:** si detecta progreso local al iniciar sesión por primera vez, intenta migrarlo para no perder avances.
- **Cerrar sesión:** la app sigue siendo usable; vuelves a modo local en vez de quedar bloqueado por autenticación.

## 🗺️ Roadmap de Evolución

### ✅ Fase 1: Cimientos y Estándares
- Refactorización de componentes monolíticos.
- Implementación de estándares de código.
- Limpieza masiva de dependencias.

### ✅ Fase 2: Seguridad y Sincronización
- Integración full stack de Supabase (Auth + PostgreSQL).
- Migración automatizada `Local Storage -> Nube`.
- Row Level Security en la base de datos.

### ✅ Fase 3: Fiabilidad y Resiliencia
- `ErrorBoundary` global para eliminar blank-screens.
- Refactor total para validación *null-safe* del cliente Supabase.
- Interfaz gráfica estandarizada (Toasts) para gestión de errores de red y sync.
- Setup de `Vitest` con primera batería de unit testing en core utilities.

### ✅ Fase 4: "El Jugo Sensorial" (UX Elevada)
- Desarrollo de API de feedback táctil, auditiva y visual (`feedback.ts`).
- Sonido 100% sintetizado (0 archivos pesados introducidos).
- Confetti renderizado sobre Canvas en celebraciones de rachas o 'Level Ups'.
- Animaciones interactivas ("spring pops" de Framer Motion) respondiendo al swipe/completado.

---

<div align="center">
  <p><i>"Aquel que conquista sus días, conquista su destino."</i></p>
</div>
