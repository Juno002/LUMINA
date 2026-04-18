/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from "motion/react";
import { AnimationSpeeds, EasingCurves } from '../../../../domain/constants/Theme';
import { SleepEntry } from "../../../../domain/entities";

interface SleepLogItemProps {
  entry: SleepEntry;
}

/**
 * SleepLogItem Component:
 * Representación de un ciclo de sueño registrado.
 */
const SleepLogItem: React.FC<SleepLogItemProps> = ({ entry }) => {
  return (
    <div className="group py-6 border-b border-ink/5 flex justify-between items-center hover:bg-ink/[0.01] transition-all px-4">
      <div className="flex flex-col gap-1">
        <div className="editorial-meta text-[9px]">{entry.date}</div>
        <div className="font-serif text-xl italic">{entry.quality}% Quality</div>
      </div>
      <div className="flex items-center gap-10">
        <div className="hidden sm:flex flex-col items-end">
          <div className="editorial-meta text-[9px] uppercase">Rhythm</div>
          <div className="font-mono text-[10px]">{entry.bedTime} — {entry.wakeTime}</div>
        </div>
        <div className="h-10 w-1 bg-ink/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${entry.quality}%` }}
 transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}
            className="w-full bg-ink"
          />
        </div>
      </div>
    </div>
  );
};

export default SleepLogItem;
