# Fase 7: ERP Profundo + Sleep CBT-I + Goals SMART

> **Prioridad:** MEDIA  
> **Dependencias:** Fase 4 (Vault), Fase 5 (Journal CBT para linked entries)  
> **Resultado:** Los tres módulos existentes (Exposure, Sleep, Goals) evolucionan de superficiales a clínicamente profundos y realmente útiles.

---

## Contexto para el Agente

### Archivos clave existentes
| Archivo | Estado actual | Gap |
|---------|---------------|-----|
| `src/domain/entities/index.ts` | `ExposureLog`: solo `preSud`, `postSud`, `duration`, `notes` | Falta: catastrophicPrediction, realOutcome, safetyBehaviors |
| `src/domain/entities/index.ts` | `SleepEntry`: solo `bedTime`, `wakeTime`, `quality`, `efficiency` | Falta: latency, awakenings, calculated efficiency |
| `src/domain/entities/index.ts` | `Goal`: solo `title`, `description`, `targetDate`, `completed`, `isSmart`, `recurrence` | Falta: milestones, progress 0-100, priority, measurement |
| `src/ui/views/ExposureView.tsx` | Jerarquía + log básico (~220 líneas) | Falta: gráfico SUDS, predicciones |
| `src/ui/views/SleepView.tsx` | Formulario bed/wake/quality (~152 líneas) | Falta: cálculos automáticos |
| `src/ui/views/GoalsView.tsx` | Lista con toggle complete (~165 líneas) | Falta: progress bars, milestones |

### Proyectos de referencia
- `docs/idea/idea 2/src/types/index.ts`:
  - `ExposureLog` con `catastrophicPrediction`, `realOutcome`, `safetyBehaviorsAvoided`
  - `SleepEntry` con `latencyMin`, `awakenings`, `awakeMinutes`, `sleepQuality` (1-5), campos calculados
  - `Goal` con `measurement`, `progress`, `priority`, `status`

---

## Cambios Detallados

### 1. EXPOSURE (ERP Profundo)

#### [MODIFY] `src/domain/entities/index.ts` — `ExposureLog`
```typescript
export interface ExposureLog {
  id: string;
  fearItemId: string;
  date: string;
  preSud: number;                     // 0-100 (SUDS before)
  postSud: number;                    // 0-100 (SUDS after)
  duration: number;                   // minutes
  notes: string;
  // NEW: ERP Phase 2 fields
  catastrophicPrediction?: string;    // "I think I will faint"
  realOutcome?: string;               // "I felt anxious but nothing happened"
  safetyBehaviorsAvoided?: string;    // "I didn't check my phone for reassurance"
}
```

#### [MODIFY] `src/ui/views/ExposureView.tsx`

**Cambios en el formulario de log:**
- Añadir 3 campos opcionales bajo un toggle "Advanced ERP":
  - "Catastrophic Prediction" (textarea): ¿Qué crees que pasará?
  - "Actual Outcome" (textarea): ¿Qué pasó realmente?
  - "Safety Behaviors Avoided" (textarea): ¿Qué conductas de seguridad evitaste?
- Cada campo con estilo editorial (font-serif italic, border-b)

**Nuevo componente: Gráfico de Habituación SUDS**
Para cada fear item con >= 2 logs:
- Gráfico de líneas (Recharts `LineChart`) mostrando:
  - X: sesiones de exposición (1, 2, 3, ...)
  - Y: SUDS (0-100)
  - Línea 1: Pre-SUDS (stroke dashed)
  - Línea 2: Post-SUDS (stroke solid)
- La tendencia descendente es el indicador visual de habituación
- Colocar debajo de la jerarquía, colapsable

**Nuevo componente: Prediction Tracker**
Para logs con `catastrophicPrediction` y `realOutcome`:
- Mostrar lado a lado: "Lo que temías" vs "Lo que pasó realmente"
- Esto debilita la creencia catastrofista visualmente

### 2. SLEEP (CBT-I)

#### [MODIFY] `src/domain/entities/index.ts` — `SleepEntry`
```typescript
export interface SleepEntry {
  id: string;
  date: string;
  bedTime: string;              // HH:mm
  wakeTime: string;             // HH:mm
  quality: number;              // 1-5 stars (was 0-100, simplify to clinical standard)
  // NEW: CBT-I fields
  latencyMin: number;           // Minutes to fall asleep
  awakenings: number;           // Number of times woken up
  awakeMinutes: number;         // Total minutes awake during the night
  notes?: string;
  // Calculated (filled automatically on save)
  timeInBedMin: number;         // Total minutes from bedTime to wakeTime
  timeAsleepMin: number;        // timeInBedMin - latencyMin - awakeMinutes
  sleepEfficiencyPct: number;   // (timeAsleepMin / timeInBedMin) * 100
}
```

#### [NEW] `src/domain/services/SleepCalculator.ts`
```typescript
export function calculateSleepMetrics(bedTime: string, wakeTime: string, latencyMin: number, awakeMinutes: number): {
  timeInBedMin: number;
  timeAsleepMin: number;
  sleepEfficiencyPct: number;
} {
  // Parse HH:mm to minutes since midnight
  const [bH, bM] = bedTime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let bedMin = bH * 60 + bM;
  let wakeMin = wH * 60 + wM;
  
  // Handle crossing midnight (e.g., 23:00 → 07:00)
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  
  const timeInBedMin = wakeMin - bedMin;
  const timeAsleepMin = Math.max(0, timeInBedMin - latencyMin - awakeMinutes);
  const sleepEfficiencyPct = timeInBedMin > 0 ? Math.round((timeAsleepMin / timeInBedMin) * 100) : 0;
  
  return { timeInBedMin, timeAsleepMin, sleepEfficiencyPct };
}
```

#### [MODIFY] `src/ui/views/SleepView.tsx`

**Cambios en el formulario:**
- Añadir campos:
  - "Minutes to fall asleep" (input number, `latencyMin`, default 15)
  - "Times woken up" (input number, `awakenings`, default 0)
  - "Total minutes awake during night" (input number, `awakeMinutes`, default 0)
- Calcular `sleepEfficiencyPct` en tiempo real al modificar cualquier campo
- Mostrar eficiencia con color: 
  - >= 85%: green (excelente)
  - 75-84%: yellow (mejorable)
  - < 75%: red (investigar causa)

**Cambios en la vista "Last Cycle":**
- Reemplazar el quality score plano por un dashboard:
  - Efficiency % prominente con ring visual
  - Time in bed vs Time asleep side by side
  - Quality stars (1-5)

**Nuevo: Sleep Efficiency Trend**
- Gráfico de líneas (últimos 7-14 días) mostrando evolución de la eficiencia
- Línea de referencia horizontal en 85% ("clinical target")

### 3. GOALS (SMART)

#### [MODIFY] `src/domain/entities/index.ts` — `Goal`
```typescript
export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  isSmart: boolean;
  recurrence: RecurrencePattern;
  lastCompletedDate?: string;
  // NEW fields
  measurement?: string;          // "Read 20 books this year"
  progress: number;              // 0-100
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'overdue';
  milestones: Milestone[];       // Sub-goals
  linkedJournalEntryId?: string; // Link to a CBT journal entry
}
```

#### [MODIFY] `src/ui/views/GoalsView.tsx`

**Cambios en el formulario de Goal:**
- Añadir campos:
  - Priority selector (3 botones: Low/Medium/High con colores)
  - Measurement (input text): "How will you measure this?"
  - Milestones section: botón "+ Add Milestone", lista editable inline

**Cambios en la vista de Goal cards:**
- Progress bar real (0-100) debajo del título
  - Calculado automáticamente: `(completedMilestones / totalMilestones) * 100`
  - O manual si no hay milestones
- Badge de prioridad (esquina superior derecha)
- Status automático:
  - `active`: en progreso
  - `completed`: progress === 100 o todas las milestones completadas
  - `overdue`: targetDate < today && !completed
- Milestones como checklist dentro de la tarjeta expandida
- Indicador visual de "overdue" (border-red-500/30)

---

## Testing

### Nuevos Tests
- `src/domain/services/SleepCalculator.test.ts`:
  - Normal: bedTime 23:00, wakeTime 07:00, latency 15, awake 10 → 8h bed, 455min asleep, 94.8% eff
  - Midnight crossing: 01:00 → 09:00 → correct
  - Edge: 0 latency, 0 awake → 100% efficiency
  - Edge: latency + awake > timeInBed → 0% efficiency (clamped)
- `src/domain/constants/Gamification.test.ts` (extender):
  - XP for EXPOSURE_SESSION = 20

### Quality Gates
```bash
npm run lint   # 0 errors
npm run build  # Clean production build
npm run test   # All tests passing
```

---

## Criterios de Aceptación

### Exposure
- [ ] Los campos "Advanced ERP" aparecen al togglear
- [ ] El gráfico SUDS muestra la habituación para cada fear item
- [ ] El prediction tracker muestra "temido vs real"

### Sleep
- [ ] La eficiencia se calcula automáticamente en tiempo real
- [ ] El dashboard "Last Cycle" muestra efficiency ring
- [ ] El gráfico de tendencia muestra últimos 7 días

### Goals
- [ ] Los milestones se pueden crear y completar
- [ ] El progress bar refleja milestones completados
- [ ] El status se actualiza automáticamente (active/completed/overdue)
- [ ] La prioridad se muestra como badge visual

### General
- [ ] `npm run build` sin errores
- [ ] `npm run lint` con 0 errores
- [ ] Tests de SleepCalculator pasando
