# Fase 6: Sistema de Hábitos + Gamificación Sensorial

> **Prioridad:** ALTA  
> **Dependencias:** Fase 4 (Vault encriptado)  
> **Resultado:** Sistema completo de tracking de hábitos con rachas (streaks), gamificación con XP/niveles, y feedback sensorial sutil (Web Audio API + confetti discreto) que convierte cada acción positiva en una micro-celebración premium.

---

## Filosofía de Diseño

### Feedback Sensorial: "Crystal, Not Arcade"
En una estética premium, **menos es más**. El feedback sensorial debe sentirse como un instrumento de precisión, no como un juego arcade:

- **Audio:** Sonidos tipo "cristal" o "aire" — un tono puro y limpio (sinusoide con decay exponencial suave, no un 8-bit chiptune). Piensa en el sonido de un MacBook al enchufarse o una notificación de iOS: corto, limpio, casi silencioso pero satisfactorio.
- **Confetti:** Pocas partículas (20-30, no 100), colores neutros (ink, paper, accent) con opacidad reducida, gravedad lenta. Debe sentirse como polvo de luz cayendo, no como una piñata explotando. Solo se activa en eventos significativos (level-up, 7-day streak).
- **Haptic:** Ya existe (`triggerHaptic`). Usar `'light'` para toggle de hábito, `'success'` solo para level-up.

### Web Audio API: Síntesis Pura, 0 Assets
Usar la Web Audio API para síntesis en lugar de archivos `.mp3` o `.wav`. No hay latencia de red ni peso de assets. Todo se genera en runtime con OscillatorNode + GainNode. Esto mantiene el build ligero y el principio Local-First intacto.

---

## Contexto para el Agente

### Archivos clave existentes
| Archivo | Rol |
|---------|-----|
| `src/domain/entities/index.ts` | Vault raíz. No tiene `habits` ni `stats`. |
| `src/shared/utils/Haptics.ts` | `triggerHaptic('light'|'success'|'heavy')` — ya funcional |
| `src/domain/constants/Theme.ts` | `AnimationSpeeds`, `EasingCurves` |
| `src/App.tsx` | Shell con tabs de navegación lateral. Habría que añadir tab "Habits". |

### Proyecto de referencia
- `docs/idea/idea 1/src/types.ts` → `Habit`, `HabitLog`, `UserStats` con XP/levels
- `docs/idea/idea 1/src/store/useHabitStore.ts` → Lógica de rachas y logs
- `docs/idea/idea 1/src/store/useAppStatsStore.ts` → Sistema de XP/levels

---

## Cambios Detallados

### 1. Domain Layer

#### [MODIFY] `src/domain/entities/index.ts`
Añadir:
```typescript
// --- Habits ---
export type HabitType = 'yesno' | 'numeric' | 'timer';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  type: HabitType;
  targetValue?: number;     // For numeric: target count. For timer: target seconds.
  unit?: string;            // "glasses", "minutes", "pages"
  frequency: 'daily' | 'weekly';
  color?: string;           // Hex color for visual identity
  isActive: boolean;
  createdAt: string;
  archivedAt?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;             // YYYY-MM-DD
  completed: boolean;
  value?: number;           // Actual value for numeric/timer habits
  note?: string;
  createdAt: string;
}

// --- Gamification ---
export interface UserStats {
  discipline: { exp: number; level: number };
  consistency: { exp: number; level: number };
  totalExp: number;
  level: number;
  currentStreak: number;    // Consecutive days with all habits completed
  longestStreak: number;
}
```

Modificar `Vault` para incluir:
```typescript
export interface Vault {
  profile: UserProfile;
  createdAt: string;
  journal: ThoughtEntry[];
  exposure: ExposureData;
  activations: ActivationActivity[];
  goals: Goal[];
  sleep: SleepEntry[];
  wellness: wellness;
  habits: Habit[];          // NEW
  habitLogs: HabitLog[];    // NEW
  stats: UserStats;         // NEW
  identity?: string;
}
```

Modificar `UserProfile` (añadir):
```typescript
soundEnabled?: boolean;   // Default: true
```

Actualizar `DEFAULT_VAULT` en `LocalForageVaultRepository.ts`:
```typescript
habits: [],
habitLogs: [],
stats: {
  discipline: { exp: 0, level: 1 },
  consistency: { exp: 0, level: 1 },
  totalExp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0
}
```

#### [NEW] `src/domain/constants/Gamification.ts`
```typescript
export const XP_REWARDS = {
  HABIT_COMPLETE: 10,
  ALL_HABITS_DAILY: 50,      // Bonus for completing all habits in a day
  JOURNAL_ENTRY: 15,
  JOURNAL_L3: 30,            // Extra for L3 restructuring
  GOAL_MILESTONE: 25,
  STREAK_BONUS_7: 100,       // 7-day streak
  STREAK_BONUS_30: 500,      // 30-day streak
  EXPOSURE_SESSION: 20,
} as const;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000
]; // Level N requires LEVEL_THRESHOLDS[N] total XP

export function getLevelFromXP(totalExp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(totalExp: number): { current: number; needed: number; progress: number } {
  const level = getLevelFromXP(totalExp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 1000;
  const current = totalExp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return { current, needed, progress: Math.min(1, current / needed) };
}
```

### 2. Application Layer

#### [NEW] `src/application/usecases/TrackHabitUseCase.ts`
Funciones puras que operan sobre el `Vault`:
```typescript
import { Vault, HabitLog, Habit } from '../../domain/entities';

export function toggleHabitLog(vault: Vault, habitId: string, today: string): Vault {
  const existingLog = vault.habitLogs.find(l => l.habitId === habitId && l.date === today);
  
  let newLogs: HabitLog[];
  if (existingLog) {
    newLogs = vault.habitLogs.map(l => 
      l.id === existingLog.id ? { ...l, completed: !l.completed } : l
    );
  } else {
    newLogs = [...vault.habitLogs, {
      id: crypto.randomUUID(),
      habitId,
      date: today,
      completed: true,
      createdAt: new Date().toISOString()
    }];
  }
  
  return { ...vault, habitLogs: newLogs };
}

export function calculateStreak(habitLogs: HabitLog[], habits: Habit[], today: string): number {
  // Count consecutive days (going backwards from today) where ALL active habits were completed
  const activeHabits = habits.filter(h => h.isActive);
  if (activeHabits.length === 0) return 0;
  
  let streak = 0;
  let checkDate = new Date(today);
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const allCompleted = activeHabits.every(h =>
      habitLogs.some(l => l.habitId === h.id && l.date === dateStr && l.completed)
    );
    if (!allCompleted) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return streak;
}

export function getHabitCompletionForDate(vault: Vault, date: string): {
  total: number;
  completed: number;
  percentage: number;
} {
  const activeHabits = vault.habits.filter(h => h.isActive);
  const logsForDate = vault.habitLogs.filter(l => l.date === date && l.completed);
  const completed = activeHabits.filter(h => logsForDate.some(l => l.habitId === h.id)).length;
  return {
    total: activeHabits.length,
    completed,
    percentage: activeHabits.length > 0 ? (completed / activeHabits.length) * 100 : 0
  };
}
```

#### [NEW] `src/application/usecases/GamificationEngine.ts`
```typescript
import { Vault, UserStats } from '../../domain/entities';
import { XP_REWARDS, getLevelFromXP } from '../../domain/constants/Gamification';

export interface XPEvent {
  type: keyof typeof XP_REWARDS;
  amount: number;
  didLevelUp: boolean;
  newLevel?: number;
}

export function awardXP(vault: Vault, eventType: keyof typeof XP_REWARDS): { vault: Vault; event: XPEvent } {
  const amount = XP_REWARDS[eventType];
  const oldLevel = getLevelFromXP(vault.stats.totalExp);
  const newTotalExp = vault.stats.totalExp + amount;
  const newLevel = getLevelFromXP(newTotalExp);
  const didLevelUp = newLevel > oldLevel;

  const newStats: UserStats = {
    ...vault.stats,
    totalExp: newTotalExp,
    level: newLevel,
    discipline: {
      ...vault.stats.discipline,
      exp: vault.stats.discipline.exp + amount,
      level: newLevel
    }
  };

  return {
    vault: { ...vault, stats: newStats },
    event: { type: eventType, amount, didLevelUp, newLevel: didLevelUp ? newLevel : undefined }
  };
}
```

### 3. Infrastructure Layer

#### [NEW] `src/infrastructure/services/WebAudioFeedbackService.ts`
Sintetizador de audio de estilo **crystal/air** usando Web Audio API (0 archivos de audio):

```typescript
// Design principles:
// - All sounds are SUBTLE. Think iOS notification, not arcade game.
// - Pure sine waves with smooth exponential decay
// - Short durations (< 400ms)
// - Respect user preference: check soundEnabled before playing

// Key functions:

// playComplete(): Single clean "ding"
//   - Sine wave at 880Hz (A5), gain 0.15, decay over 200ms
//   - Like a crystal glass being tapped once

// playSuccess(): Ascending crystal chime
//   - 3 sine waves: C5(523Hz) → E5(659Hz) → G5(784Hz)
//   - Each 80ms, gain 0.12, staggered start
//   - Total duration: ~300ms
//   - Like wind chimes in a gentle breeze

// playLevelUp(): Ascending arpeggio with resonance
//   - 4 notes: C5 → E5 → G5 → C6(1047Hz)
//   - Each 100ms, gain 0.2 (slightly louder than normal)
//   - Slight reverb (delay node at 30ms, feedback 0.2)
//   - Total: ~500ms
//   - Like a crystal bell tower

// playStreak(): Quick rhythmic double-tap
//   - 2 sine waves at 660Hz, 50ms apart
//   - Gain 0.1, very subtle
//   - Total: ~150ms

// Implementation:
const ctx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency: number, duration: number, gain: number, startTime: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}
```

#### [NEW] `src/infrastructure/services/ConfettiService.ts`
Explosión **sutil** de partículas sobre un canvas overlay:

```typescript
// Design principles:
// - FEW particles: 20-30, not 100
// - Neutral colors: ink (#1a1a1a), paper (#FAF8F5), accent tones
// - Reduced opacity: particles at 0.3-0.6 opacity
// - Slow gravity: feels like dust of light falling, not a piñata
// - Self-cleans after 2.5 seconds
// - Only triggered on: level-up, 7-day streak, goal completion

// API: confetti({ 
//   particleCount?: number,    // default: 25
//   spread?: number,           // default: 60
//   origin?: {x: number, y: number},  // default: {0.5, 0.3}
//   colors?: string[]          // default: ['#1a1a1a', '#FAF8F5', '#999']
// })

// Implementation:
// - Create temporary canvas element (position: fixed, inset: 0, pointer-events: none, z-index: 9999)
// - Generate particles with random velocity, rotation, and slight size variation (3-6px)
// - Physics: y += vy; vy += 0.15 (slow gravity); opacity -= 0.005
// - Render with requestAnimationFrame
// - Remove canvas element after all particles fade
```

### 4. Presentation Layer

#### [NEW] `src/ui/views/HabitsView.tsx`
Diseño editorial consistente con el resto de la app:

**Header:**
- "Rhythm / Daily Architecture" (editorial-meta)
- "Discipline Forged." (font-serif text-3xl md:text-4xl)
- Botón "+ New Habit" (bg-ink text-paper rounded-full px-6 py-2 text-sm)

**Habit Grid (grid-cols-1 md:grid-cols-2 gap-6):**
Por cada hábito activo:
- Tarjeta: `border border-ink/10 rounded-2xl p-6 bg-paper`
- Nombre: `font-serif italic text-lg`
- Tipo: icono sutil (Check para yesno, Hash para numeric, Clock para timer) en text-accent
- Botón toggle/complete:
  - Círculo: `w-10 h-10 rounded-full border-2 border-ink/20`
  - Al completar: `bg-ink` con checkmark animado (scale spring)
  - Trigger: `triggerHaptic('light')` + `playComplete()` audio
- Streak counter: `font-mono text-[10px]` con icono `Flame` de lucide (size 12) si streak > 0
- Si numeric: mini progress bar debajo

**Weekly Heatmap (debajo del grid):**
- 7 columnas (L M M J V S D), cada celda es un cuadrado
- Color: `bg-ink/5` (sin datos) → `bg-ink/20` (parcial) → `bg-ink` (all done)
- Tooltips con porcentaje al hover

**Stats Footer (grid-cols-3):**
- Current Streak: `font-serif text-3xl` + "days" en editorial-meta
- Level: `font-serif text-3xl` + XP progress bar (h-1 bg-ink/10 con fill bg-ink)
- Longest Streak: `font-serif text-3xl` + "record" en editorial-meta

#### [NEW] `src/ui/components/shared/LevelUpModal.tsx`
- Overlay: `bg-ink/80 backdrop-blur-sm` (glassmorphism)
- Contenido centrado, motion.div:
  - `initial={{ scale: 0.8, opacity: 0 }}`
  - `animate={{ scale: 1, opacity: 1 }}`
  - `transition={{ type: 'spring', damping: 20, stiffness: 300 }}`
- "LEVEL UP" en `font-mono uppercase tracking-[0.3em] text-paper/50 text-xs`
- Número de nivel: `font-serif text-7xl text-paper` centrado
- Subtexto: `font-serif italic text-paper/60 text-sm` "Your discipline has evolved."
- Dispara: `confetti()` + `playLevelUp()` automáticamente
- Auto-dismiss: 3 segundos o click en cualquier parte
- `triggerHaptic('success')`

#### [MODIFY] `src/App.tsx`
- Añadir tab "Habits" en la navegación lateral (icono: `Flame` de lucide-react)
- Importar HabitsView con `React.lazy`
- Integrar feedback engine: cuando `awardXP()` retorna `didLevelUp: true`, mostrar LevelUpModal

---

## Testing

### Nuevos Tests
- `src/domain/constants/Gamification.test.ts`:
  - `getLevelFromXP(0)` → 1
  - `getLevelFromXP(100)` → 2
  - `getLevelFromXP(99)` → 1
  - `getXPForNextLevel(150)` → correct progress calculation
- `src/application/usecases/TrackHabitUseCase.test.ts`:
  - Toggle creates log if none exists
  - Toggle flips completed if log exists
  - `getHabitCompletionForDate` returns correct percentage
  - `calculateStreak` counts consecutive days correctly
- `src/application/usecases/GamificationEngine.test.ts`:
  - `awardXP` increments totalExp
  - `awardXP` detects level-up correctly
  - `awardXP` does not flag level-up if same level

### Quality Gates
```bash
npm run lint   # 0 errors
npm run build  # Clean production build
npm run test   # All tests passing
```

---

## Criterios de Aceptación
- [ ] Se pueden crear hábitos (yesno, numeric, timer) con nombre y frecuencia
- [ ] Los hábitos se marcan como completados para el día actual con animación spring
- [ ] Completar un hábito produce: haptic 'light' + audio crystal 'ding'
- [ ] El streak se calcula correctamente (días consecutivos con todos completados)
- [ ] Completar hábitos otorga XP (visible en la barra de progreso)
- [ ] Al subir de nivel aparece el LevelUpModal con confetti sutil + audio arpeggio + haptic 'success'
- [ ] El confetti es discreto (20-30 partículas, colores neutros, gravedad lenta)
- [ ] El audio es tipo "crystal" (sine waves, < 400ms, gain ≤ 0.2)
- [ ] El weekly heatmap muestra el historial visual
- [ ] El tab "Habits" aparece en la navegación
- [ ] El usuario puede silenciar audio via `soundEnabled` en settings
- [ ] `npm run build` sin errores, `npm run lint` 0 errores
