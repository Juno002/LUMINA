export const GOLDEN_PROMPTS = [
  "¿Qué fricción te detuvo hoy?",
  "¿Mantuviste la intención o cediste a la inercia?",
  "¿Qué verdad o incomodidad evitaste enfrentar hoy?",
  "¿En qué momento perdiste el control de tu atención?",
  "Si hoy se repitiera infinitas veces, ¿serías la persona que quieres ser?",
  "¿Fuiste útil para tus objetivos o solo estuviste ocupado?",
  "¿A qué le diste más importancia de la que merecía?",
  "¿Qué pequeña acción de hoy te acercó silenciosamente a tu visión?",
  "¿De qué excusa te convenciste a ti mismo el día de hoy?",
  "¿Cuál fue el mayor acto de resistencia mental de hoy?"
];

// Seeded random selection based on the date so the prompt stays the same for a whole day
export function getDailyPrompt(): string {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % GOLDEN_PROMPTS.length;
  return GOLDEN_PROMPTS[index];
}
