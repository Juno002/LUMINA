/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Brain } from 'lucide-react';
import { AnimationSpeeds, EasingCurves } from '../../../../domain/constants/Theme';

interface DistortionDatum {
  count: number;
  name: string;
}

interface AnalysisSidePanelProps {
  avgICC: number;
  foundationsLabel: string;
  insightsCopy: string;
  insightsLabel: string;
  noPatternsLabel: string;
  distortionData: DistortionDatum[];
}

export default function AnalysisSidePanel({
  avgICC,
  foundationsLabel,
  insightsCopy,
  insightsLabel,
  noPatternsLabel,
  distortionData
}: AnalysisSidePanelProps) {
  return (
    <div className="col-span-12 flex flex-col gap-10 lg:col-span-4">
      <div className="flex flex-col gap-4">
        <div className="editorial-meta">{foundationsLabel}</div>
        <div className="flex flex-col gap-4">
          {distortionData.length === 0 ? (
            <p className="editorial-meta py-4 text-xs italic opacity-30">{noPatternsLabel}</p>
          ) : (
            distortionData.map((distortion, index) => (
              <div key={distortion.name} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm italic">
                  <span className="capitalize">{distortion.name}</span>
                  <span className="font-mono text-[10px] opacity-50">{distortion.count} x</span>
                </div>
                <div className="h-[1px] w-full overflow-hidden bg-ink/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((distortion.count / 10) * 100, 100)}%` }}
                    transition={{
                      delay: index * 0.1,
                      duration: AnimationSpeeds.fluid,
                      ease: EasingCurves.editorial
                    }}
                    className="h-full bg-ink/40"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-4 rounded-3xl border border-ink/10 bg-ink p-8 text-paper">
        <Brain size={24} className="opacity-50" />
        <div className="editorial-meta opacity-50">{insightsLabel}</div>
        <p className="text-sm italic leading-relaxed">{insightsCopy}</p>
        <div className="editorial-meta opacity-30">ICC {avgICC.toFixed(2)}</div>
      </div>
    </div>
  );
}
