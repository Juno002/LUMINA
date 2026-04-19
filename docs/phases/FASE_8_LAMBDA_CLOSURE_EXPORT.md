# Fase 8: Lambda Avatar + Day Closure + Data Export + PWA

> **Prioridad:** BAJA (Polish & Premium Differentiation)  
> **Dependencias:** Todas las fases anteriores (4-7)  
> **Resultado:** Lumina se siente como un producto terminado con un guía visual reactivo (Lambda), un ritual de cierre diario, export para terapeutas, e instalabilidad como PWA.

---

## Filosofía de Diseño

### Lambda es un Espejo, No una Entidad
Lambda (λ) **no es IA, no habla, no genera texto, no es un bot.** Es un **reflejo visual** — un espejo de tus propios datos. Su estado (Mentor/Observer/Anchor) se decide por **reglas matemáticas puras** basadas en tus métricas de ICC y SUDS. Es como un dashboard condensado en una sola partícula animada.

Esto es fundamental: Lambda no pretende ser inteligente. Es un **indicador de estado emocional/cognitivo** que el usuario aprende a "leer" con el tiempo, como leer un termómetro. La credibilidad del sistema depende de que Lambda nunca se sienta como un chatbot — siempre como un instrumento de precisión.

### Crisis Accesible por Gesto
El Crisis Plan (definido en Fase 4) debe ser invocable en cualquier momento mediante un **long-press** en el símbolo λ del dashboard, o mediante el botón SOS siempre visible. Si el vault está bloqueado, el CrisisView se abre desde el LockScreen (ya implementado en Fase 4).

---

## Contexto para el Agente

### Archivos clave existentes (post Fases 4-7)
| Archivo | Rol |
|---------|-----|
| `src/domain/entities/index.ts` | `Vault` con todos los datos, `CrisisConfig`, `UserStats` |
| `src/domain/services/ICCCalculator.ts` | (Fase 5) ICC calculation |
| `src/domain/constants/Gamification.ts` | (Fase 6) XP/Levels |
| `src/ui/views/DashboardView.tsx` | Vista principal — Lambda viviría aquí |
| `src/ui/views/CrisisView.tsx` | (Fase 4) Plan de crisis |
| `src/ui/views/SettingsView.tsx` | Para export y configuración |
| `src/domain/constants/Theme.ts` | `AnimationSpeeds`, `EasingCurves` |

### Proyecto de referencia
- `docs/idea/idea 2/src/lib/reflejo.ts` → Lógica completa del avatar con 3 modos
- `docs/idea/idea 2/src/lib/export.ts` → Export ZIP con JSON, MD, CSV
- `docs/idea/idea 1/src/types.ts` → `DayClosure`, `WeeklyInsight`

---

## Cambios Detallados

### 1. LAMBDA AVATAR

#### [NEW] `src/domain/services/ReflejoEngine.ts`
Lógica pura (sin dependencias de UI). Lambda es un reflejo de reglas matemáticas, no IA:

```typescript
export type ReflejoMode = 'mentor' | 'observer' | 'anchor';

export interface ReflejoState {
  mode: ReflejoMode;
  message: string;
  color: string;        // Tailwind color class
  animation: 'float' | 'neutral' | 'pulse-slow';
}

export function getReflejoState(params: {
  avgICC: number | null;           // Average ICC from recent L3 entries
  currentIntensity: number | null; // Current/last entry intensity
  isCrisis: boolean;               // High-risk language detected
  isRumination: boolean;           // Same distortion 3+ times in recent entries
  totalEntries: number;
  todayEntries: number;
}): ReflejoState {
  // Priority 1: ANCHOR (crisis, high intensity, low ICC, rumination)
  if (params.isCrisis || (params.currentIntensity && params.currentIntensity >= 8)) {
    return {
      mode: 'anchor',
      message: 'Breathe. This feeling is real, but it is temporary.',
      color: 'text-amber-400',
      animation: 'pulse-slow'
    };
  }
  if (params.isRumination) {
    return {
      mode: 'anchor',
      message: 'A pattern is forming. Consider a different angle.',
      color: 'text-amber-400',
      animation: 'pulse-slow'
    };
  }
  if (params.avgICC !== null && params.avgICC < 0.35) {
    return {
      mode: 'anchor',
      message: 'The belief persists. Try gathering more counter-evidence.',
      color: 'text-amber-400',
      animation: 'pulse-slow'
    };
  }

  // Priority 2: MENTOR (high ICC, first entry of day)
  if (params.avgICC !== null && params.avgICC > 0.60) {
    return {
      mode: 'mentor',
      message: 'Your restructuring is working. The pattern is shifting.',
      color: 'text-emerald-400',
      animation: 'float'
    };
  }
  if (params.todayEntries === 1 && params.totalEntries > 0) {
    return {
      mode: 'mentor',
      message: 'Consistency is its own reward. Welcome back.',
      color: 'text-emerald-400',
      animation: 'float'
    };
  }

  // Priority 3: OBSERVER (default)
  return {
    mode: 'observer',
    message: 'Observing without judgment.',
    color: 'text-blue-400',
    animation: 'neutral'
  };
}
```

#### [NEW] `src/application/usecases/GetReflejoStateUseCase.ts`
Calcula los inputs para `getReflejoState` a partir del `Vault`:
```typescript
import { Vault } from '../../domain/entities';
import { getReflejoState, ReflejoState } from '../../domain/services/ReflejoEngine';
import { calculateICC } from '../../domain/services/ICCCalculator';

export function computeReflejoState(vault: Vault): ReflejoState {
  const journal = vault.journal || [];
  const today = new Date().toISOString().split('T')[0];
  
  // Average ICC from last 10 L3 entries
  const l3Entries = journal.filter(e => e.level === 3 && e.originalIntensity && e.finalCredibility);
  const recentL3 = l3Entries.slice(0, 10);
  const avgICC = recentL3.length > 0
    ? recentL3.reduce((sum, e) => sum + calculateICC(e.originalIntensity!, e.finalCredibility!).value, 0) / recentL3.length
    : null;
  
  // Rumination: same distortion in 3+ of last 5 entries
  const recentEntries = journal.slice(0, 5);
  const distortionCount: Record<string, number> = {};
  recentEntries.forEach(e => (e.distortions || []).forEach(d => {
    distortionCount[d] = (distortionCount[d] || 0) + 1;
  }));
  const isRumination = Object.values(distortionCount).some(count => count >= 3);
  
  // Today's entries
  const todayEntries = journal.filter(e => e.date === today).length;
  
  // Last entry intensity
  const lastEntry = journal[0];
  const currentIntensity = lastEntry?.intensity ?? null;
  
  return getReflejoState({
    avgICC,
    currentIntensity,
    isCrisis: false, // Crisis detection is manual via CrisisView
    isRumination,
    totalEntries: journal.length,
    todayEntries
  });
}
```

#### [NEW] `src/ui/components/shared/LambdaAvatar.tsx`
Componente visual minimalista que vive en el DashboardView:

**Layout:**
```
┌──────────────────────────────────────┐
│                                      │
│         ◉  ← Círculo animado        │
│         λ  ← Símbolo centrado       │
│                                      │
│  "Observing without judgment."       │  ← font-serif italic text-sm
│                                      │
│         ○ ○ ●                        │  ← 3 dots indicando modo
│    anchor observer mentor            │  ← font-mono text-[8px]
│                                      │
└──────────────────────────────────────┘
```

**Animaciones (Framer Motion):**
- `float`: `animate={{ y: [0, -8, 0] }}`, `transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}`
- `neutral`: `animate={{ opacity: [0.7, 1, 0.7] }}`, `transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}`
- `pulse-slow`: `animate={{ scale: [1, 1.08, 1] }}`, `transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}` + box-shadow glow animado

**Interacciones:**
- **Long-press (500ms)** en el símbolo λ → abre CrisisView (accesible siempre, es la puerta de emergencia silenciosa)
- Click normal → no hace nada (Lambda observa, no se presiona como un botón)

**Colores del círculo:** Los colores cambian con `AnimationSpeeds.fluid` transition
- Anchor: `bg-amber-400/20 border-amber-400/40`
- Observer: `bg-blue-400/20 border-blue-400/40`
- Mentor: `bg-emerald-400/20 border-emerald-400/40`

### 2. DAY CLOSURE

#### [MODIFY] `src/domain/entities/index.ts`
```typescript
export interface DayClosure {
  date: string;         // YYYY-MM-DD
  summary: string;      // User reflection (one sentence)
  gratitude: string[];  // 3 things grateful for
  closedAt: string;     // ISO timestamp
}
```

Añadir a `Vault`:
```typescript
closedDays: DayClosure[];  // NEW
```

Actualizar DEFAULT_VAULT:
```typescript
closedDays: []
```

#### [NEW] `src/ui/views/DayClosureView.tsx`
Modal/overlay que aparece cuando el usuario lo activa (botón en Dashboard o Settings):

**Flujo (3 pasos animados con AnimatePresence):**

1. **"How would you summarize today?"**
   - textarea, font-serif italic, auto-focus
   - Placeholder: "In one sentence..."
   - Fondo oscuro (bg-ink), texto paper — atmósfera nocturna

2. **"Three things you're grateful for:"**
   - 3 inputs inline, numerados con font-mono
   - Minimal styling: solo border-bottom

3. **Day Summary (auto-calculated):**
   - Stats del día presentados como editorial-meta:
     - "Habits: X/Y completed"
     - "Journal entries: X"
     - "Exposures logged: X"
     - "Sleep quality: X stars" (si hay)
   - Botón "Close the Day" → guarda DayClosure
   - Trigger: `triggerHaptic('success')` + confetti sutil si all habits done

**Diseño:** Fondo `bg-ink`, texto `text-paper`. Animación de entrada: fade from bottom (`initial={{ y: 20, opacity: 0 }}`). Cada paso transiciona con `AnimationSpeeds.fluid`.

### 3. DATA EXPORT

#### [NEW] `src/infrastructure/services/DataExportService.ts`
Genera archivos exportables sin depender de librerías externas:

**Función 1: `exportMarkdownReport(vault: Vault): string`**
- Genera un informe Markdown legible para compartir con terapeuta
- Secciones:
  - **Summary:** Período, total entries, average ICC, clinical profile
  - **Recent Sessions (7 días):** Tabla con date, emotion, intensity, level, ICC
  - **Distortion Patterns:** Top 5 distorsiones detectadas con frecuencia
  - **Sleep Trends:** Average efficiency, quality
  - **Goals Progress:** Lista con progress %
- NO incluye datos raw sensibles, solo métricas y patrones
- Formato Markdown limpio, listo para imprimir

**Función 2: `exportCSV(vault: Vault): string`**
- Tabla CSV con columnas: `date,emotion,intensity,level,distortions,icc,outcomeMood,outcomeIntensity`
- Solo journal entries para análisis numérico en Excel/Sheets

**Función 3: `downloadFile(content: string, filename: string, mimeType: string)`**
- Helper: Crea un `Blob` + `URL.createObjectURL` + `<a>` element + click + `URL.revokeObjectURL`
- Soporta: `text/markdown`, `text/csv`

#### [MODIFY] `src/ui/views/SettingsView.tsx`
Añadir sección "Data Export":
- Botón "Export Report (MD)" → llama `downloadFile(exportMarkdownReport(vault), 'lumina-report-YYYY-MM-DD.md', 'text/markdown')`
- Botón "Export Data (CSV)" → llama `downloadFile(exportCSV(vault), 'lumina-data-YYYY-MM-DD.csv', 'text/csv')`
- Nota editorial: "Share the report with your therapist. The CSV is for your own analysis." (font-serif italic text-xs text-accent)

### 4. PWA

#### [NEW] `public/manifest.json`
```json
{
  "name": "Lumina",
  "short_name": "Lumina",
  "description": "Cognitive wellness companion",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF8F5",
  "theme_color": "#1a1a1a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### [MODIFY] `index.html`
Añadir en `<head>`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#1a1a1a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icon-192.png">
```

#### Iconos
- Usar la herramienta `generate_image` del agente para crear iconos 192x192 y 512x512
- Diseño: fondo paper (#FAF8F5), símbolo λ centrado en ink (#1a1a1a), bordes redondeados, minimalista

(Nota: Service Worker con Workbox es opcional en esta fase. El manifest + meta tags ya habilitan "Add to Home Screen" en Chrome/Edge/Safari.)

---

## Testing

### Nuevos Tests
- `src/domain/services/ReflejoEngine.test.ts`:
  - Crisis input → anchor mode
  - High ICC (> 0.60) → mentor mode
  - Default (null ICC, no crisis) → observer mode
  - Rumination (same distortion 3x) → anchor mode
  - First entry of day → mentor mode
- `src/infrastructure/services/DataExportService.test.ts`:
  - `exportMarkdownReport` returns string containing expected headers
  - `exportCSV` returns string with correct column headers
  - Empty vault produces valid (empty) export

### Quality Gates
```bash
npm run lint   # 0 errors
npm run build  # Clean production build
npm run test   # All tests passing
```

---

## Criterios de Aceptación

### Lambda
- [ ] El avatar aparece en el Dashboard como un indicador visual minimalista
- [ ] Cambia de modo (anchor/observer/mentor) según ICC, intensidad y patrones de rumiación
- [ ] Las animaciones son suaves y no intrusivas (float, neutral, pulse)
- [ ] El mensaje es contextualmente relevante y en font-serif italic
- [ ] Long-press en λ abre CrisisView (puerta de emergencia silenciosa)
- [ ] Lambda NUNCA se siente como un chatbot — siempre como un instrumento de lectura

### Day Closure
- [ ] El ritual de cierre captura reflexión + 3 gratitudes
- [ ] Los stats del día se calculan automáticamente
- [ ] Se guarda en `vault.closedDays`
- [ ] Atmósfera nocturna (bg-ink, text-paper)

### Data Export
- [ ] El reporte MD es legible y profesional para un terapeuta
- [ ] El CSV se abre correctamente en Excel/Sheets con columnas correctas
- [ ] Los archivos se descargan al hacer click

### PWA
- [ ] El manifest.json es válido (DevTools → Application → Manifest)
- [ ] La app muestra "Add to Home Screen" en Chrome/Edge mobile
- [ ] Los iconos se muestran correctamente

### General
- [ ] `npm run build` sin errores
- [ ] `npm run lint` con 0 errores
- [ ] Tests pasando
