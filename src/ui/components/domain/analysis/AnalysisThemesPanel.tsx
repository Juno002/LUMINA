/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface InferredTheme {
  desc: string;
  title: string;
}

interface AnalysisThemesPanelProps {
  description: string;
  heading: string;
  overline: string;
  themes: InferredTheme[] | null;
}

export default function AnalysisThemesPanel({
  description,
  heading,
  overline,
  themes
}: AnalysisThemesPanelProps) {
  if (!themes || themes.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-10 rounded-[3rem] border border-ink/5 bg-paper p-10 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <div className="editorial-meta uppercase tracking-widest opacity-40">{overline}</div>
        <h3 className="font-serif text-3xl italic">{heading}.</h3>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {themes.map((theme, index) => (
          <div key={`${theme.title}-${index}`} className="group flex flex-col gap-4">
            <div className="h-[1px] w-10 bg-ink/20 transition-all duration-700 group-hover:w-20"></div>
            <div className="flex flex-col gap-2">
              <span className="font-serif text-xl italic transition-colors group-hover:text-ink">
                {theme.title}
              </span>
              <p className="font-serif text-sm italic leading-relaxed text-accent opacity-60">"{theme.desc}"</p>
            </div>
          </div>
        ))}
      </div>

      <p className="editorial-meta max-w-xl text-[10px] italic opacity-30">{description}</p>
    </motion.div>
  );
}
