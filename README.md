<div align="center">
<img width="1200" height="475" alt="LUMINA Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LUMINA

**LUMINA** is a high-fidelity, local-first clinical operating system for the mind. It bridges the gap between rigorous therapeutic protocols and premium user experience, providing a "digital psychodramatic intervention" space for cognitive and behavioral transformation.

Built upon the foundational principles of **Cognitive Behavioral Therapy (CBT)**, **Dialectical Behavior Therapy (DBT)**, and **CBT-I (Insomnia)**, LUMINA empowers users to become their own therapists through structured self-observation and evidence-based action.

---

## 🧠 Clinical Philosophy: "Think, Act, Be"

LUMINA's architecture is strictly aligned with the framework presented in:
> **"Terapia Cognitivo-Conductual Fácil: Principios y Práctica"** by *Seth J. Gillihan*.

The application focuses on the three pillars of emotional health:
1.  **Think (Cognitive):** Identifying and restructuring dysfunctional thought patterns.
2.  **Act (Behavioral):** Breaking the cycle of avoidance through behavioral activation and exposure.
3.  **Be (Mindfulness):** Cultivating a non-judgmental "observer" state through the Reflejo Engine.

---

## ✨ Key Clinical Features

### 1. λ Reflejo Engine (The Clinical Mediator)
A context-aware avatar that guides the user's journey. It calculates a dynamic state based on clinical markers:
*   **Anchor (Red):** High-intensity activation (80%+ distress). Triggers immediate grounding protocols.
*   **Observer (Silver):** Moderate distress. Encourages cognitive distancing and reflection.
*   **Mentor (Amber):** Stability and growth. Focuses on consistency and momentum.

### 2. The Chronicle (3-Level Journaling)
A progressive disclosure system for cognitive restructuring:
*   **Level 1 (Capture):** Automatic thoughts and distortion detection.
*   **Level 2 (Friend Technique):** A specialized UI that externalizes thoughts as dialogue («quoted and italicized»), forcing the brain to overcome cognitive blind spots by "borrowing" a friend's perspective.
*   **Level 3 (Evidence Lab):** Balanced analysis of evidence for/against a belief, resulting in the **Cognitive Change Index (ICC)**.

### 3. Behavioral Momentum & Resilience
*   **Activation Tracker:** Feedback loops comparing *Expected* vs. *Actual* Joy and Effort to break depressive filters.
*   **Resilience Recovery Bonus:** A gamified system that rewards **returning** to habits after a lapse, explicitly designed to combat "all-or-nothing" thinking.

### 4. Advanced Analysis & Core Beliefs
*   **The Pattern Cloud:** Automatically detects recurrent cognitive distortions.
*   **Core Beliefs Inference:** Suggests underlying clinical themes (e.g., *Rigid Perfectionism*, *Interpersonal Hypersensitivity*) by analyzing long-term distortion frequency.

### 5. Ghost Protocol (Absence Care)
A compassionate protocol that detects 4+ days of inactivity. Instead of "streak-shaming" notifications, it provides a pressure-free, non-judgmental welcome: *"Silence is also information. Your Vault is here when you are ready."*

---

## 🛠️ Technical Stack

LUMINA is built with a modern, high-performance stack optimized for smooth, "editorial" interactions:

*   **Core:** React 19 + Vite (Type-safe ESM architecture)
*   **Styling:** Tailwind CSS 4.0 (Custom design system with tokens for *Paper*, *Ink*, and *Accent*)
*   **Animations:** Motion (Framer Motion) for fluid, physics-based transitions.
*   **State & Storage:** Local-first architecture using `LocalForage` (IndexedDB) and the **Web Crypto API** for AES-GCM Zero-Knowledge encryption.
*   **Visualization:** Recharts for clinical trend analysis.
*   **Icons:** Lucide-React.

---

## 🛡️ Security & Privacy

LUMINA operates on a **Zero-Knowledge** principle.
*   **Local Encryption:** Your data never leaves your device unencrypted.
*   **Privacy-First:** No external tracking, no cloud sync (unless manually exported), and no third-party AI APIs. All clinical processing happens on-device.

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/your-repo/lumina.git

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 📖 Clinical Reference
Gillihan, S. J. (2020). *Terapia Cognitivo-Conductual Fácil: Principios y Práctica*. Editorial Sirio.

---

<div align="center">
<i>"The discipline is the architecture of the soul. Continue."</i> — <b>Reflejo λ</b>
</div>
