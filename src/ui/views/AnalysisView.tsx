/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Activity, Brain, TrendingUp } from 'lucide-react';
import { COGNITIVE_DISTORTIONS } from '../../domain/constants/Distortions';
import { calculateICC } from '../../domain/services/ICCCalculator';
import { useTranslation } from '../../application/contexts/LanguageContext';
import { Vault, ThoughtEntry, ActivationActivity } from '../../domain/entities';
import AnalysisMetricTabs, { AnalysisMetric } from '../components/domain/analysis/AnalysisMetricTabs';
import AnalysisSidePanel from '../components/domain/analysis/AnalysisSidePanel';
import AnalysisStatCards from '../components/domain/analysis/AnalysisStatCards';
import AnalysisThemesPanel from '../components/domain/analysis/AnalysisThemesPanel';
import AnalysisTrendPanel from '../components/domain/analysis/AnalysisTrendPanel';

export default function AnalysisView({ vault }: { vault: Vault }) {
  const { t, language } = useTranslation();
  const [activeMetric, setActiveMetric] = useState<AnalysisMetric>('mood');

  const journalEntries = useMemo(() => vault.journal || [], [vault.journal]);
  const activations = useMemo(() => vault.activations || [], [vault.activations]);
  const distortionNameMap = useMemo(
    () => new Map(COGNITIVE_DISTORTIONS.map((distortion) => [distortion.id, distortion.name])),
    []
  );

  // Data processing
  const trendData = useMemo(
    () =>
      [...journalEntries.slice(0, 10)].reverse().map((entry: ThoughtEntry) => {
        let iccVal = 0;
        if (entry.level === 3 && entry.originalIntensity !== undefined && entry.finalCredibility !== undefined) {
          iccVal = calculateICC(entry.originalIntensity, entry.finalCredibility).value * 100;
        }

        return {
          name: entry.date.split('-').slice(1).join('/'),
          intensity: (entry.intensity || 0) * 10,
          activity: activations.filter(
            (activity: ActivationActivity) => activity.plannedDate === entry.date && activity.completed
          ).length * 20,
          icc: iccVal
        };
      }),
    [journalEntries, activations]
  );

  const distortionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    journalEntries.forEach((e: ThoughtEntry) => {
      (e.distortions || []).forEach((d: string) => {
        counts[d] = (counts[d] || 0) + 1;
      });
    });
    return counts;
  }, [journalEntries]);

  const distortionData = useMemo(
    () =>
      Object.entries(distortionCounts)
        .map(([id, count]) => ({
          name: distortionNameMap.get(id) || id.replace(/_/g, ' '),
          count: count as number
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [distortionCounts, distortionNameMap]
  );

  const avgICC = useMemo(() => {
    const l3Entries = journalEntries.filter(e => e.level === 3 && e.originalIntensity !== undefined && e.finalCredibility !== undefined);
    if (l3Entries.length === 0) return 0;
    const sum = l3Entries.reduce((acc, e) => acc + calculateICC(e.originalIntensity!, e.finalCredibility!).value, 0);
    return sum / l3Entries.length;
  }, [journalEntries]);

  // Core Beliefs Inference (Clinical Logic)
  const inferredBeliefs = useMemo(() => {
    if (journalEntries.length < 5) return null;
    
    const themes = [];
    const perfectionismCount =
      (distortionCounts['all_or_nothing'] || 0) +
      (distortionCounts['overgeneralization'] || 0) +
      (distortionCounts['should_statements'] || 0);
    const anticipatoryThreatCount =
      (distortionCounts['jumping_to_conclusions'] || 0) +
      (distortionCounts['magnification'] || 0);
    const interpersonalThreatCount =
      (distortionCounts['personalization'] || 0) +
      (distortionCounts['jumping_to_conclusions'] || 0) +
      (distortionCounts['labeling'] || 0);

    if (perfectionismCount >= 4) {
      themes.push({ 
        title: language === 'es' ? 'Perfeccionismo Rígido' : 'Rigid Perfectionism', 
        desc: language === 'es' ? 'Tendencia a evaluar tu valor en términos de todo o nada.' : 'Tendency to evaluate your worth in all-or-nothing terms.'
      });
    }
    if (anticipatoryThreatCount >= 4) {
      themes.push({ 
        title: language === 'es' ? 'Desesperanza Anticipatoria' : 'Anticipatory Hopelessness', 
        desc: language === 'es' ? 'Foco excesivo en resultados futuros negativos como si fueran hechos.' : 'Excessive focus on negative future outcomes as if they were facts.'
      });
    }
    if (interpersonalThreatCount >= 4) {
      themes.push({ 
        title: language === 'es' ? 'Hipersensibilidad Interpersonal' : 'Interpersonal Hypersensitivity', 
        desc: language === 'es' ? 'Asunción de juicios externos negativos sin evidencia directa.' : 'Assumption of negative external judgments without direct evidence.'
      });
    }

    return themes.length > 0 ? themes : null;
  }, [distortionCounts, journalEntries.length, language]);

  const metricLabels = useMemo(
    () => ({
      mood: t('analysis.mood_flux'),
      activation: t('analysis.activity_pulse'),
      icc: t('analysis.cognitive_change')
    }),
    [t]
  );

  const trendPanelTitles = useMemo(
    () => ({
      mood: t('analysis.emotional_intensity'),
      activation: t('analysis.behavioral_momentum'),
      icc: t('analysis.cognitive_restructuring')
    }),
    [t]
  );

  const insightCopy = avgICC > 0.6 ? t('analysis.insight_high') : avgICC > 0.35 ? t('analysis.insight_mid') : t('analysis.insight_low');
  const statCards = useMemo(
    () => [
      { label: t('analysis.stat_avg_change'), value: avgICC.toFixed(2), sub: t('analysis.stat_avg_sub'), icon: TrendingUp },
      { label: t('analysis.stat_momentum'), value: activations.filter((activity: ActivationActivity) => activity.completed).length, sub: t('analysis.stat_momentum_sub'), icon: Activity },
      { label: t('analysis.stat_continuity'), value: journalEntries.length, sub: t('analysis.stat_continuity_sub'), icon: Brain }
    ],
    [activations, avgICC, journalEntries.length, t]
  );

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <div className="editorial-meta">{t('analysis.subtitle')}</div>
          <h2 className="font-serif text-3xl md:text-4xl">{t('analysis.title')}.</h2>
        </div>
        <AnalysisMetricTabs activeMetric={activeMetric} labels={metricLabels} onChange={setActiveMetric} />
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8">
          <AnalysisTrendPanel
            activeMetric={activeMetric}
            noDataLabel={t('analysis.no_data')}
            panelTitle={trendPanelTitles}
            sectionLabel={t('analysis.historical_horizon')}
            trendData={trendData}
          />
        </div>

        <AnalysisSidePanel
          avgICC={avgICC}
          distortionData={distortionData}
          foundationsLabel={t('analysis.foundations')}
          insightsCopy={insightCopy}
          insightsLabel={t('analysis.pulse_insights')}
          noPatternsLabel={t('analysis.no_patterns')}
        />
      </div>

      <AnalysisThemesPanel
        description={
          language === 'es'
            ? '* Este analisis es inferencial basado en patrones de distorsion. Usalo como punto de partida para la reflexion.'
            : '* This analysis is inferential based on distortion patterns. Use it as a starting point for reflection.'
        }
        heading={language === 'es' ? 'Temas Recurrentes' : 'Recurrent Themes'}
        overline={language === 'es' ? 'Analisis de Creencias Centrales' : 'Core Beliefs Analysis'}
        themes={inferredBeliefs}
      />

      <div className="editorial-rule"></div>

      <AnalysisStatCards stats={statCards} />
    </div>
  );
}
