/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExposureLog } from "../../../../domain/entities";

interface LogItemProps {
  log: ExposureLog;
  anchorText: string;
}

/**
 * LogItem Component:
 * Registro histórico de un ciclo de exposición.
 */
const LogItem: React.FC<LogItemProps> = ({ log, anchorText }) => {
  return (
    <div className="py-6 border-b border-ink/5 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className="editorial-meta text-[9px]">{log.date}</span>
        <span className="font-serif text-lg italic">{anchorText}</span>
      </div>
      <div className="flex items-baseline gap-4">
        <span className="editorial-meta">Habituation /</span>
        <span className="font-mono text-xs">{log.preSud} → {log.postSud} SUD</span>
      </div>
    </div>
  );
};

export default LogItem;
