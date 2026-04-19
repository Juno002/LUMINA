# Fase 4: Vault Encriptado + Crisis Plan

> **Prioridad:** CRÍTICA  
> **Dependencias:** Ninguna (Fase base)  
> **Resultado:** El vault se almacena cifrado con AES-GCM. El usuario tiene un PIN/password obligatorio. La app se auto-bloquea tras inactividad. Existe un plan de crisis activable **incluso con el vault bloqueado**.

---

## Filosofía de Diseño

### El Desbloqueo como Ritual de Entrada
La seguridad no debe sentirse como una barrera sino como **encender un instrumento de precisión**. El unlock flow debe durar ≤ 0.3s de desencriptación (Web Crypto es casi instantánea, <50ms), envuelto en una animación editorial `AnimationSpeeds.fluid` que cree la sensación de "abrir un espacio seguro".

### "Contratos antes que Implementación"
La app no sabe *cómo* se encripta, solo sabe que *se puede* encriptar. El `ICryptoService` se define en Domain; la implementación AES-GCM vive en Infrastructure. El Repository actúa como **pasamanos**: recibe datos → los pasa por CryptoService → guarda ruido ilegible. El resto de la app ni siquiera sabe que los datos están cifrados.

### El Crisis Plan es Ética, no Feature
Al ser una app con profundidad clínica (CBT/ERP), el Crisis Plan es una **responsabilidad**. Decisión arquitectónica clave: **el CrisisView debe ser accesible ANTES de desbloquear el vault**. Es el único elemento "público" de la app. Los contactos de emergencia y el redirect a BreathingView deben funcionar con un long-press o botón dedicado visible en el LockScreen.

---

## Contexto para el Agente

### Arquitectura actual
- **Patrón:** Clean Architecture ("La Cebolla"). Las dependencias siempre van hacia adentro.
- **Capas:** `domain/` → `application/` → `infrastructure/` → `ui/` (presentation)
- **Estado:** Un único objeto `Vault` persiste en `localforage` (IndexedDB) vía `LocalForageVaultRepository.ts`. Actualmente se guarda en **texto plano**.
- **Hook central:** `useVault()` en `src/application/hooks/useVault.ts` expone `vault`, `isReady`, `updateVault`, `initializeUser`, `wipeAllData`.
- **Estilo:** Tailwind CSS 4 + Framer Motion (`motion/react`). Animaciones con `AnimationSpeeds.fluid` (0.3s) y `EasingCurves.editorial`.

### Archivos clave existentes
| Archivo | Rol |
|---------|-----|
| `src/domain/entities/index.ts` | Todas las interfaces del dominio. `Vault` es la raíz. |
| `src/domain/repositories/IVaultRepository.ts` | Contrato: `save(Vault)`, `load()`, `wipe()` |
| `src/infrastructure/repositories/LocalForageVaultRepository.ts` | Implementación actual (sin encriptación) |
| `src/application/hooks/useVault.ts` | Hook de React que conecta UI ↔ Infraestructura |
| `src/App.tsx` | Shell principal. Si `!vault.profile.initialized` → WelcomeView |
| `src/ui/views/WelcomeView.tsx` | Onboarding (solo pide nombre) |
| `src/ui/views/SettingsView.tsx` | Settings con botón "Wipe All Data" |

### Proyecto de referencia
- `docs/idea/idea 2/src/lib/client-crypto.ts` contiene la implementación AES-GCM + PBKDF2 completa (53 líneas). Usar como base.

---

## Cambios Detallados

### 1. Domain Layer

#### [MODIFY] `src/domain/entities/index.ts`
Añadir al final del archivo:

```typescript
export interface CrisisContact {
  id: string;
  name: string;
  phone: string;
}

export interface CrisisConfig {
  copingPhrase: string;
  contacts: CrisisContact[];
}

export type ClinicalProfile = 'anxiety' | 'depression' | 'anger' | 'unspecified';
```

Modificar `UserProfile`:
```typescript
export interface UserProfile {
  name: string;
  initialized: boolean;
  avatarSeed?: string;
  clinicalProfile?: ClinicalProfile;
  crisisConfig?: CrisisConfig;
  autoLockMinutes?: number; // Default: 5
}
```

#### [NEW] `src/domain/contracts/ICryptoService.ts`
```typescript
export interface ICryptoService {
  encrypt(plainText: string, password: string): Promise<ArrayBuffer>;
  decrypt(cipherData: ArrayBuffer, password: string): Promise<string | null>;
}
```

#### [MODIFY] `src/domain/repositories/IVaultRepository.ts`
Cambiar la interfaz para soportar encriptación:
```typescript
import { Vault } from '../entities';

export interface IVaultRepository {
  save(data: Vault, password: string): Promise<boolean>;
  load(password: string): Promise<Vault | null>; // null = wrong password
  exists(): Promise<boolean>; // Check if a vault exists (without decrypting)
  wipe(): Promise<boolean>;
}
```

### 2. Infrastructure Layer

#### [NEW] `src/infrastructure/services/CryptoService.ts`
Implementación completa basada en `docs/idea/idea 2/src/lib/client-crypto.ts`:
- `PBKDF2` con 200,000 iteraciones para derivar la clave del password
- `AES-GCM` con IV de 12 bytes y salt de 16 bytes
- El blob almacenado es: `salt(16) + iv(12) + ciphertext`
- Exponerlo como clase que implemente `ICryptoService`
- La desencriptación debe ser < 50ms en hardware moderno

#### [MODIFY] `src/infrastructure/repositories/LocalForageVaultRepository.ts`
- `save(data, password)`: Serializar `Vault` a JSON string → `TextEncoder` → `CryptoService.encrypt()` → guardar `ArrayBuffer` en localforage
- `load(password)`: Leer `ArrayBuffer` → `CryptoService.decrypt()` → `JSON.parse` → devolver `Vault`. Si decrypt falla (contraseña incorrecta), devolver `null`.
- `exists()`: Verificar si la key `encrypted_vault_data` existe en localforage (sin intentar descifrar)
- Mantener `DEFAULT_VAULT` como fallback para vault nuevo
- Mantener la lógica de migración de campos existente

### 3. Application Layer

#### [MODIFY] `src/application/hooks/useVault.ts`
Cambios significativos:
- Añadir estado `isLocked: boolean` (empieza en `true`)
- Añadir estado `password: string | null` (se mantiene en memoria mientras el vault está abierto)
- Añadir estado `vaultExists: boolean`
- `unlockVault(password: string)`: llama a `repository.load(password)`, si retorna `null` → error de contraseña, si retorna `Vault` → setVault + setIsLocked(false)
- `createVault(name: string, password: string)`: crea vault nuevo con DEFAULT + nombre, guarda con password
- `lockVault()`: setVault(null), setIsLocked(true), password = null (borrar de memoria)
- `updateVault(newVault)`: usa el password almacenado en memoria para re-encriptar y guardar
- Auto-lock: useEffect con timer basado en `vault.profile.autoLockMinutes` que escucha eventos de actividad del usuario (mousemove, keypress, touchstart). Al expirar → `lockVault()`

Hook debe exportar:
```typescript
{
  vault, isReady, isLocked, vaultExists,
  unlockVault, createVault, lockVault,
  updateVault, wipeAllData
}
```

### 4. Presentation Layer

#### [NEW] `src/ui/views/LockScreenView.tsx`

**Ergonomía del unlock:**
- Centrado vertical. Fondo limpio `bg-paper`.
- Logo λ sutil en la parte superior (opacity-20, font-serif text-6xl)
- Input de contraseña tipo password con estilo editorial:
  - `font-serif italic text-xl`, solo border-bottom `border-ink/20 focus:border-ink`
  - Placeholder: "Enter your passphrase..."
- Botón "Unlock" → `bg-ink text-paper rounded-full`, aparece solo si hay input
- Animación de error: shake horizontal (translateX [-10, 10, -5, 5, 0], duration 0.3s) + borde rojo momentáneo
- Si `!vaultExists` → Mostrar flujo de creación:
  1. Paso 1: Nombre (input)
  2. Paso 2: Contraseña + confirmar contraseña
  3. Aviso editorial en font-mono text-[9px]: "This passphrase is unrecoverable. If you forget it, your data will be permanently inaccessible."
- **Botón de Crisis visible siempre** (esquina inferior): Icono `ShieldAlert` de lucide, text-accent, texto "SOS". Al hacer long-press (500ms) o click, abre CrisisView **sin necesidad de desbloquear**.

#### [NEW] `src/ui/views/CrisisView.tsx`
- **Accesible sin desbloquear el vault.** Los datos de crisis (contactos, frase) se guardan en un key de localforage separado, sin encriptar, llamado `lumina_crisis_config`.
- Fondo oscuro: `bg-ink text-paper`
- Header: "Safety Protocol" (font-serif text-3xl)
- Sección 1: "Your Coping Phrase" — texto grande, font-serif italic, centrado
- Sección 2: "Emergency Contacts" — lista con botones `<a href="tel:...">` prominentes (bg-paper text-ink rounded-full)
- Sección 3: "Crisis Hotlines" — hardcodeados:
  - 🇺🇸 988 — National Suicide Prevention Lifeline
  - 🇪🇸 024 — Línea de Ayuda
  - 🇩🇴 809-566-0100 — Emergencias RD
  - 🌍 findahelpline.com
- Sección 4: Botón "Start Breathing Exercise" → navega a BreathingView (si el vault está desbloqueado) o abre un timer 4-7-8 simplificado inline
- Botón "Close" para volver al LockScreen

#### [MODIFY] `src/ui/views/SettingsView.tsx`
- Añadir sección "Security" con:
  - Botón "Change Password"
  - Slider "Auto-lock timer" (1, 3, 5, 10, 30 min)
  - Link "Edit Crisis Plan" → CrisisView
- Añadir sección "Data" con:
  - Botón "Lock Now" → `lockVault()`

#### [MODIFY] `src/App.tsx`
- Cambiar flujo principal:
  1. Si `!isReady` → null (loading)
  2. Si `isLocked` → `<LockScreenView />` (con botón SOS siempre visible)
  3. Si `!vault.profile.initialized` → `<WelcomeView />`
  4. Else → App normal

---

## Testing

### Nuevos Tests
- `src/infrastructure/services/CryptoService.test.ts`:
  - Encrypt + decrypt roundtrip produces identical plaintext
  - Wrong password returns null
  - Different salts produce different ciphertexts for same input
  - Empty string encrypts/decrypts correctly
- `src/application/hooks/useVault.test.ts` (o test de integración):
  - Smoke test del flujo lock/unlock

### Quality Gates
```bash
npm run lint   # 0 errors
npm run build  # Clean production build
npm run test   # All tests passing
```

---

## Criterios de Aceptación
- [ ] El vault se almacena cifrado en IndexedDB (verificable via DevTools → Application → IndexedDB → el valor es un ArrayBuffer, no JSON legible)
- [ ] Una contraseña incorrecta muestra error animado (shake) y no desbloquea
- [ ] El unlock flow completo (input → desencriptar → mostrar app) se siente ≤ 0.3s
- [ ] La app se auto-bloquea tras X minutos de inactividad
- [ ] El CrisisView es accesible **sin desbloquear el vault** vía botón SOS en LockScreen
- [ ] Los contactos de emergencia se almacenan fuera del vault encriptado
- [ ] `npm run build` sin errores
- [ ] `npm run lint` con 0 errores
