/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExposureLog } from "../../../../domain/entities";
import { Clock } from 'lucide-react';

interface LogItemProps {
  log: ExposureLog;
  anchorText: string;
}

const LogItem: React.FC<LogItemProps> = ({ log, anchorText }) => {
  const reduction = log.preSud - log.postSud;
  
  return (
    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <span className="editorial-meta text-[9px] opacity-40 uppercase tracking-tighter">{log.date}</span>
           {reduction > 0 && (
             <span className="bg-green-500/10 text-green-600 text-[7px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">
               -{reduction} SUD Reduction
             </span>
           )}
        </div>
        <h4 className="font-serif text-xl italic leading-tight">{anchorText}</h4>
      </div>
      
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2 opacity-50">
           <Clock size={12} />
           <span className="font-mono text-xs">{log.duration}m</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs opacity-30">{log.preSud}</span>
            <span className="editorial-meta opacity-20">→</span>
            <span className="font-mono text-xl font-light">{log.postSud}</span>
          </div>
          <span className="text-[7px] editorial-meta uppercase opacity-30">Distress Level</span>
        </div>
      </div>
    </div>
  );
};

export default LogItem;
