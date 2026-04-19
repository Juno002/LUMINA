# Fase 5: Journal CBT de 3 Niveles + Distortion Detection + ICC

> **Prioridad:** ALTA  
> **Dependencias:** Fase 4 (Vault encriptado — para que los journals estén cifrados)  
> **Resultado:** El journal evoluciona de un formulario plano a un sistema CBT de 3 niveles progresivos con detección automática de distorsiones cognitivas y cálculo del Índice de Cambio Cognitivo (ICC).

---

## Filosofía de Diseño

### Progressive Disclosure: "Respira"
**NO satures la pantalla con los 3 niveles de una vez.** El usuario empieza SIEMPRE en L1. Los niveles superiores se revelan orgánicamente:

1. **L1 se muestra por defecto.** Es lo que ve un usuario nuevo.
2. **L2 se sugiere contextualmente.** Cuando el Motor de Distorsiones detecta una o más distorsiones en el pensamiento automático, aparece un nudge sutil: un chip animado que dice *"Would you like to go deeper?"* con un botón para expandir a L2. El usuario también puede tocar manualmente el indicador L1→L2→L3 en cualquier momento.
3. **L3 se sugiere tras L2.** Si el usuario completó L2 (friendResponse no está vacío), aparece el nudge para L3: *"Ready to challenge this thought with evidence?"*

La interfaz **nunca muestra campos vacíos de niveles superiores**. L2 y L3 se despliegan con `AnimatePresence` (motion/react) como secciones que crecen desde height: 0 con `AnimationSpeeds.fluid`.

### Motor de Distorsiones como UseCase
El Motor de Distorsiones se implementa como un UseCase en la capa de aplicación. Las keywords viven en `Domain/Constants`, lo que permite:
- Futuro soporte multilenguaje (solo añadir keywords en español)
- Actualizar el catálogo sin tocar la lógica de detección
- Testear la detección con tests unitarios puros

---

## Contexto para el Agente

### ¿Qué es el CBT de 3 Niveles?
Basado en la metodología de Aaron T. Beck y David Burns:
- **L1 — Autoobservación:** Solo registrar la situación, emoción e intensidad. Sin juicio. Meta: construir consciencia.
- **L2 — Desplazamiento Creativo:** L1 + "¿Qué le dirías a un amigo en esta situación?" (técnica Friend). Meta: crear distancia emocional.
- **L3 — Reestructuración Cognitiva Completa:** L2 + evidencia a favor/en contra del pensamiento + respuesta alternativa + credibilidad antes/después. Meta: cambiar creencias.

### ¿Qué es el ICC?
```
ICC = (Intensidad Original - Credibilidad Final) / 10
Rango: 0.0 a 1.0
> 0.60: Excelente cambio cognitivo
0.35–0.60: Cambio moderado
< 0.35: Necesita más trabajo
```

### Archivos clave existentes
| Archivo | Estado actual |
|---------|---------------|
| `src/domain/entities/index.ts` | `ThoughtEntry` tiene solo: `situation`, `primaryEmotion`, `intensity`, `automaticThought`, `distortions: string[]`, `rationalResponse`, `outcomeMood`, `outcomeIntensity`, `tags` |
| `src/ui/views/JournalView.tsx` | Formulario plano con campos básicos. ~200 líneas. |
| `src/ui/views/AnalysisView.tsx` | Gráficos de intensidad + conteo de distorsiones básico con Recharts |
| `src/ui/components/domain/journal/EntryCard.tsx` | Tarjeta de entrada del journal |

### Proyecto de referencia
- `docs/idea/idea 2/src/types/index.ts` → `ThoughtEntry` con campos L3 completos
- `docs/idea/idea 2/src/lib/distortions.ts` → Motor de detección por keywords + priorización por perfil clínico
- `docs/idea/idea 2/src/lib/reflejo.ts` → Uso del ICC para determinar feedback

---

## Cambios Detallados

### 1. Domain Layer

#### [MODIFY] `src/domain/entities/index.ts`
Expandir `ThoughtEntry`:
```typescript
export interface ThoughtEntry {
  id: string;
  date: string;
  level: 1 | 2 | 3;               // NEW: Nivel CBT
  
  // L1 — Autoobservación (campos obligatorios)
  situation: string;
  primaryEmotion: string;
  intensity: number;                // 1-10
  automaticThought: string;
  tags: string[];
  
  // L2 — Desplazamiento (campos opcionales, requeridos si level >= 2)
  friendResponse?: string;          // NEW: "¿Qué le dirías a un amigo?"
  creativeLink?: string;            // NEW: Metáfora/analogía libre
  
  // L3 — Reestructuración (campos opcionales, requeridos si level === 3)
  evidenceFor?: string;             // NEW: Evidencia a favor del pensamiento
  evidenceAgainst?: string;         // NEW: Evidencia en contra
  originalIntensity?: number;       // NEW: Credibilidad inicial (1-10)
  finalCredibility?: number;        // NEW: Credibilidad tras challenge (1-10)
  rationalResponse: string;         // Ya existe
  
  // Metadata
  distortions: string[];
  outcomeMood: string;
  outcomeIntensity: number;
}
```

#### [NEW] `src/domain/constants/Distortions.ts`
Catálogo completo de distorsiones cognitivas con keywords para detección.
Las keywords son el mecanismo de Pattern Matching — no hay IA, solo coincidencias de texto rápidas, privadas y predecibles:
```typescript
export interface CognitiveDistortionDef {
  id: string;
  name: string;           // "All-or-Nothing Thinking"
  description: string;
  example: string;
  keywords: string[];     // ["always", "never", "everything", "nothing", "completely"]
}

export const COGNITIVE_DISTORTIONS: CognitiveDistortionDef[] = [
  {
    id: 'all_or_nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black-or-white categories.',
    example: '"If I don\'t do this perfectly, I\'m a total failure."',
    keywords: ['always', 'never', 'everything', 'nothing', 'completely', 'totally', 'perfect', 'ruined']
  },
  {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Viewing a single negative event as a never-ending pattern.',
    example: '"This always happens to me."',
    keywords: ['always', 'everybody', 'nobody', 'every time', 'everyone']
  },
  {
    id: 'mental_filter',
    name: 'Mental Filter',
    description: 'Dwelling on negatives while ignoring positives.',
    example: '"The whole day was ruined because of that one mistake."',
    keywords: ['only', 'ruined', 'terrible', 'horrible', 'worst']
  },
  {
    id: 'discounting_positives',
    name: 'Discounting the Positive',
    description: 'Insisting positive experiences don\'t count.',
    example: '"That doesn\'t count, anyone could have done that."',
    keywords: ['doesn\'t count', 'but', 'just lucky', 'anyone could', 'not a big deal']
  },
  {
    id: 'jumping_to_conclusions',
    name: 'Jumping to Conclusions',
    description: 'Making negative interpretations without definite facts.',
    example: '"They must think I\'m stupid."',
    keywords: ['must think', 'probably', 'i know they', 'i bet', 'they think']
  },
  {
    id: 'magnification',
    name: 'Magnification / Catastrophizing',
    description: 'Blowing things out of proportion.',
    example: '"This is the worst thing that could ever happen."',
    keywords: ['worst', 'catastrophe', 'disaster', 'unbearable', 'can\'t stand', 'end of the world']
  },
  {
    id: 'emotional_reasoning',
    name: 'Emotional Reasoning',
    description: 'Assuming negative emotions reflect reality.',
    example: '"I feel like a failure, therefore I must be one."',
    keywords: ['i feel like', 'i feel that', 'feels like', 'must be']
  },
  {
    id: 'should_statements',
    name: 'Should Statements',
    description: 'Criticizing yourself or others with "shoulds" and "musts".',
    example: '"I should have known better."',
    keywords: ['should', 'must', 'have to', 'ought to', 'supposed to']
  },
  {
    id: 'labeling',
    name: 'Labeling',
    description: 'Attaching a fixed label to yourself or others.',
    example: '"I\'m a loser." / "He\'s a jerk."',
    keywords: ['i\'m a', 'he\'s a', 'she\'s a', 'they\'re', 'loser', 'idiot', 'failure', 'worthless']
  },
  {
    id: 'personalization',
    name: 'Personalization',
    description: 'Blaming yourself for something that wasn\'t your fault.',
    example: '"It\'s all my fault that the project failed."',
    keywords: ['my fault', 'because of me', 'i caused', 'i\'m to blame', 'if only i']
  }
];

// Distortions prioritized by clinical profile
export const PROFILE_DISTORTION_PRIORITY: Record<string, string[]> = {
  anxiety: ['magnification', 'jumping_to_conclusions', 'emotional_reasoning'],
  depression: ['mental_filter', 'overgeneralization', 'personalization', 'should_statements'],
  anger: ['personalization', 'labeling', 'should_statements'],
  unspecified: []
};
```

#### [NEW] `src/domain/services/ICCCalculator.ts`
Función pura, sin dependencias:
```typescript
export interface ICCResult {
  value: number;       // 0.0 to 1.0
  label: 'excellent' | 'moderate' | 'needs_work';
  message: string;
}

export function calculateICC(originalIntensity: number, finalCredibility: number): ICCResult {
  const value = Math.max(0, Math.min(1, (originalIntensity - finalCredibility) / 10));
  
  if (value > 0.60) return { value, label: 'excellent', message: 'Excellent cognitive shift detected.' };
  if (value >= 0.35) return { value, label: 'moderate', message: 'Moderate restructuring. Try deeper evidence.' };
  return { value, label: 'needs_work', message: 'The belief is still strong. Gather more counter-evidence.' };
}
```

### 2. Application Layer

#### [NEW] `src/application/usecases/DetectDistortionsUseCase.ts`
```typescript
import { COGNITIVE_DISTORTIONS, PROFILE_DISTORTION_PRIORITY, CognitiveDistortionDef } from '../../domain/constants/Distortions';
import { ClinicalProfile } from '../../domain/entities';

export function detectDistortions(text: string, clinicalProfile?: ClinicalProfile): CognitiveDistortionDef[] {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const detected: CognitiveDistortionDef[] = [];
  const ids = new Set<string>();

  for (const distortion of COGNITIVE_DISTORTIONS) {
    for (const keyword of distortion.keywords) {
      if (lowerText.includes(keyword.toLowerCase()) && !ids.has(distortion.id)) {
        detected.push(distortion);
        ids.add(distortion.id);
        break;
      }
    }
  }

  // Sort by clinical relevance
  if (clinicalProfile && clinicalProfile !== 'unspecified') {
    const priority = PROFILE_DISTORTION_PRIORITY[clinicalProfile] || [];
    detected.sort((a, b) => {
      const aIdx = priority.indexOf(a.id);
      const bIdx = priority.indexOf(b.id);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }

  return detected;
}
```

### 3. Presentation Layer

#### [MODIFY] `src/ui/views/JournalView.tsx` — Progressive Disclosure Form

**Principio clave: el formulario RESPIRA. Nunca se muestran campos de niveles no activados.**

**Nivel Indicator (siempre visible en la parte superior):**
- 3 dots/circles inline: `● ○ ○` (L1), `● ● ○` (L2), `● ● ●` (L3)
- Estilo: `font-mono text-[10px] tracking-widest uppercase`, "Level 1 · Observe"
- Click en un dot superior para manualmente avanzar de nivel (pero el camino natural es la revelación contextual)

**L1 (siempre visible):**
- Situation (textarea, placeholder: "What happened?")
- Automatic Thought (textarea, placeholder: "What crossed your mind?")
- Emotion (input, placeholder: "e.g., Anxious, Sad, Frustrated")
- Intensity (range 1-10, con valor numérico visible)

**Distortion Detection (en L1, debajo de "Automatic Thought"):**
- Al escribir en "Automatic Thought", ejecutar `detectDistortions()` con **debounce de 500ms**
- Si se detectan distorsiones, mostrarlas como chips animados (`AnimatePresence`, motion.div con initial={{opacity:0, y:5}}):
  - Cada chip: `bg-ink/5 border border-ink/10 rounded-full px-3 py-1 text-[11px] font-mono`
  - El usuario puede click en ✕ para remover falsos positivos
- **Nudge para L2:** Si hay >= 1 distorsión detectada, mostrar debajo de los chips:
  - `"Distortion detected. Would you like to challenge it?"` (font-serif italic text-sm text-accent)
  - Botón "Go Deeper →" que activa L2 con animación de expansión

**L2 (visible si level >= 2, animado con AnimatePresence):**
- Sección envuelta en `motion.div` con `initial={{height: 0, opacity: 0}}`, `animate={{height: 'auto', opacity: 1}}`, `transition={{ duration: AnimationSpeeds.fluid }}`
- Separador editorial: `<div className="editorial-rule" />`
- Label: "Level 2 · Displacement" (editorial-meta)
- "What would you say to a friend in this situation?" (textarea, `friendResponse`)
- Creative Link / Metaphor (textarea opcional, `creativeLink`, placeholder: "A metaphor, image, or analogy...")
- **Nudge para L3:** Si `friendResponse` no está vacío (length > 10), mostrar:
  - `"Ready to challenge this thought with evidence?"` (font-serif italic text-sm text-accent)
  - Botón "Full Restructuring →" que activa L3

**L3 (visible si level === 3, animado con AnimatePresence):**
- Separador editorial
- Label: "Level 3 · Restructure" (editorial-meta)
- Original belief intensity (range 1-10, `originalIntensity`, label: "How much do you believe this thought?")
- Evidence FOR the thought (textarea, `evidenceFor`, placeholder: "Facts that support this thought...")
- Evidence AGAINST the thought (textarea, `evidenceAgainst`, placeholder: "Facts that contradict this thought...")
- Rational Response (textarea, ya existe, placeholder: "A balanced perspective...")
- Final credibility (range 1-10, `finalCredibility`, label: "How much do you believe it now?")
- **ICC Display (en tiempo real):**
  - Badge circular con el valor: `font-mono text-lg font-bold`
  - Color: `text-emerald-500` (> 0.60), `text-amber-500` (0.35-0.60), `text-red-400` (< 0.35)
  - Mensaje del ICCResult debajo en font-serif italic text-xs

#### [MODIFY] `src/ui/components/domain/journal/EntryCard.tsx`
- Mostrar badge de nivel (L1/L2/L3) en la esquina superior derecha: `font-mono text-[9px] bg-ink/5 rounded-full px-2`
- Si L3 y tiene ICC: mostrar ICC badge con color al lado del nivel
- Mostrar distorsiones como chips compactos debajo del contenido

#### [MODIFY] `src/ui/views/AnalysisView.tsx`
- Añadir gráfico de ICC over time (solo entradas L3) como segundo chart
- Mejorar el gráfico de distorsiones con tooltips de nombre completo

---

## Testing

### Nuevos Tests
- `src/domain/services/ICCCalculator.test.ts`:
  - `calculateICC(8, 3)` → value: 0.5, label: 'moderate'
  - `calculateICC(9, 2)` → value: 0.7, label: 'excellent'
  - `calculateICC(5, 5)` → value: 0.0, label: 'needs_work'
  - Edge: negatives clamped to 0, overflow clamped to 1
- `src/application/usecases/DetectDistortionsUseCase.test.ts`:
  - "I should have known better" → detecta `should_statements`
  - "This always happens, I'm such a loser" → detecta `overgeneralization` + `labeling`
  - "" (empty) → returns []
  - Clinical profile sorting test

### Quality Gates
```bash
npm run lint   # 0 errors
npm run build  # Clean production build
npm run test   # All tests passing
```

---

## Criterios de Aceptación
- [ ] El formulario abre SIEMPRE en L1 — nunca muestra campos L2/L3 inicialmente
- [ ] Las distorsiones se detectan automáticamente con debounce de 500ms al escribir en "Automatic Thought"
- [ ] Al detectar distorsiones, aparece un nudge contextual para ir a L2
- [ ] Al completar friendResponse en L2, aparece un nudge para ir a L3
- [ ] L2 y L3 se despliegan con animación (AnimatePresence, height: 0 → auto)
- [ ] El usuario puede manualmente seleccionar cualquier nivel con el indicador de dots
- [ ] L3 calcula y muestra el ICC en tiempo real con color semántico
- [ ] El EntryCard muestra el badge de nivel y ICC
- [ ] AnalysisView muestra el gráfico de ICC over time
- [ ] `npm run build` sin errores
- [ ] `npm run lint` con 0 errores
- [ ] Tests de ICCCalculator y DetectDistortions pasando
