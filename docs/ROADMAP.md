# Lumina — Roadmap de Evolución

> **Versión:** 1.2 (MVP Completado)
> **Última actualización:** 2026-04-18  
> **Estado:** Fases 1-8 COMPLETADAS. Comenzando Fase 9 (Polishing & Deployment).

---

## Visión del Producto

Lumina es la fusión orgánica de dos proyectos:
- **Iterum** — Productividad gamificada para alto rendimiento (hábitos, XP, feedback sensorial)
- **Cognit λ** — Diario cognitivo clínico basado en CBT/ERP (encriptado, privado, offline-first)

El resultado es un **ecosistema de bienestar cognitivo** que interactúa silenciosamente debajo de una capa de simplicidad editorial premium.

---

## Principios de Diseño (Ajustes de Ergonomía)

### 1. Progressive Disclosure — "La app respira"
No saturar la pantalla. El usuario ve solo lo que necesita. Los niveles superiores (L2, L3 del journal) se revelan **contextualmente** cuando el sistema detecta que hay profundidad que explorar, no como tabs vacíos esperando ser llenados.

### 2. Crystal, Not Arcade — "Feedback premium"
El feedback sensorial (audio, confetti, haptics) debe sentirse como un instrumento de precisión, no como un juego. Sonidos tipo "cristal" (sine waves con decay), confetti discreto (20-30 partículas, colores neutros), haptics calibrados.

### 3. Lambda es un Espejo, No una Entidad
Lambda no es IA, no habla, no genera texto. Es un **reflejo visual** — un indicador de estado cognitivo basado en reglas matemáticas puras (ICC, SUDS, patrones de rumiación). Como un termómetro, no un chatbot.

### 4. Contratos antes que Implementación
La app no sabe *cómo* se encripta, solo sabe que *se puede* encriptar. El `ICryptoService` se define en Domain; el AES-GCM vive en Infrastructure. El resto de la app ni siquiera sabe que los datos están cifrados — "simplemente sucede" al cruzar la frontera de infraestructura.

### 5. Crisis Plan es Ética, No Feature
Al ser una app con profundidad clínica, el Crisis Plan es una responsabilidad. Es accesible **incluso con el vault bloqueado**. Long-press en λ = puerta de emergencia silenciosa.

### 6. Motores en Lugar de IA
Sin IA, la "magia" viene de algoritmos transparentes 100% client-side:
- **Motor de Distorsiones:** Pattern Matching por keywords (rápido, privado, predecible)
- **Lambda:** Reglas matemáticas sobre ICC y SUDS (espejo de datos, no entidad externa)
- **Gamificación:** XP/levels determinísticos (no recomendaciones ML)

---

## Fases Completadas ✅ (MVP v1.0)

Todas las fases arquitectónicas y funcionales primarias se han cerrado con éxito, pasando sus respectivos Quality Gates (Lint, Build, Tests).

| # | Fase | Resumen de Implementación |
|---|------|---------------------------|
| 1 | Deuda Técnica | Clean Architecture establecida, 0 dependencias acopladas en Domain. |
| 2 | Tipado/Estética | Tipos estrictos, diseño editorial en UI con Tailwind CSS. |
| 3 | Quality Gates | Vitest integrado, ESLint limpio. |
| 4 | Vault Encriptado | AES-GCM funcionando con CryptoService; Crisis Plan seguro y accesible. |
| 5 | Journal CBT | Framework progresivo de 3 niveles y motor de distorsiones con cálculo de ICC. |
| 6 | Hábitos & Gamificación | Momentum Store, WebAudioFeedbackService y Confetti discretos listos. |
| 7 | ERP + Sleep + Goals | Rastreo de SUDS, módulos CBT-I para latencia/eficiencia de sueño y metas SMART. |
| 8 | Day Closure & Lambda | Ritual de cierre diario implementado, y avatar reactivo funcional. |

---

## Fases Pendientes 🚀

| # | Fase | Prioridad | Resultado Esperado |
|---|------|-----------|-------------------|
| 9 | Polishing & Deployment | 🔴 CRÍTICA | Revisión UX/UI en dispositivos móviles, pruebas E2E, empaquetado como PWA, despliegue a producción. |

---

## Reglas para Agentes IA

1. **Lee el documento de fase COMPLETO** antes de empezar a codificar.
2. **Respeta la arquitectura de capas.** Domain nunca importa de infrastructure o ui.
3. **Ejecuta las 3 quality gates** al terminar cada fase:
   ```bash
   npm run lint   # 0 errors
   npm run build  # Clean production build
   npm run test   # All tests passing
   ```
4. **Estilo visual:** Tailwind CSS 4, Framer Motion con `AnimationSpeeds` y `EasingCurves` de `Theme.ts`.
5. **Iconos:** Solo de `lucide-react`. No importar iconos que no se usan.
6. **Cada fase es independiente y deployable.** No dejar la app rota entre fases.
7. **Feedback sensorial:** Sutil, premium, tipo crystal. No arcade.
8. **Progressive Disclosure:** Mostrar solo lo que el usuario necesita en el momento.

---

## Estructura del Proyecto

```
src/
├── domain/                  # El Corazón (0 dependencias externas)
│   ├── entities/            # Interfaces TypeScript puras
│   ├── constants/           # Theme, Distortions, Gamification
│   ├── contracts/           # ICryptoService
│   ├── repositories/        # IVaultRepository
│   └── services/            # ICCCalculator, SleepCalculator, ReflejoEngine
│
├── application/             # Casos de Uso
│   ├── hooks/               # useVault (React hook principal)
│   └── usecases/            # DetectDistortions, TrackHabit, GamificationEngine
│
├── infrastructure/          # Detalles de Implementación
│   ├── repositories/        # LocalForageVaultRepository (encriptado)
│   └── services/            # CryptoService, WebAudioFeedback, ConfettiService, DataExport
│
├── shared/                  # Utilidades transversales
│   ├── utils/               # DateFormatter, Haptics, TailwindMerge, StringNormalizer
│   └── components/          # ErrorBoundary
│
└── ui/                      # Presentación (La Cáscara)
    ├── views/               # Vistas principales (1 por tab + LockScreen, CrisisView, DayClosure)
    ├── components/          # Componentes de UI
    │   ├── domain/          # Componentes específicos por módulo
    │   └── shared/          # LevelUpModal, LambdaAvatar
    ├── App.tsx              # Shell principal
    └── App.test.tsx         # Smoke test
```
