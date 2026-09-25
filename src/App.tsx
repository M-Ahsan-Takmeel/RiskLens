import React, { useState, useMemo, useCallback } from 'react';
import {
  SimulationParams,
  SimulationResult,
  runMonteCarloSimulation,
  PRESET_STRATEGIES,
} from './utils/simulation';
import { useDebounce } from './hooks/useDebounce';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsPanel } from './components/StatsPanel';
import { EquityChart } from './components/EquityChart';
import { DistributionHistograms } from './components/DistributionHistograms';
import { KellyInsightCard } from './components/KellyInsightCard';

export default function App() {
  const [params, setParams] = useState<SimulationParams>({
    winRate: 50,
    rewardToRisk: 2.0,
    startingBalance: 10000,
    riskPerTrade: 2.0,
    numTrades: 100,
    numCurves: 500,
    ruinThresholdPct: 50,
    ruinMode: 'from_start',
  });

  const [seed, setSeed] = useState(0);

  // Debounce simulation parameters (40ms) for smooth live updates while dragging sliders
  const debouncedParams = useDebounce(params, 40);

  // Re-run Monte Carlo simulation when debounced parameters change or seed changes
  const simulation: SimulationResult = useMemo(() => {
    return runMonteCarloSimulation(debouncedParams);
  }, [debouncedParams, seed]);

  const handleRerun = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = PRESET_STRATEGIES.find((p) => p.id === presetId);
    if (!preset) return;

    setParams((prev) => ({
      ...prev,
      winRate: preset.winRate,
      rewardToRisk: preset.rewardToRisk,
      riskPerTrade: preset.riskPerTrade,
      numTrades: preset.numTrades,
      ruinThresholdPct: preset.ruinThresholdPct,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Application Header */}
      <Header simulation={simulation} onRerun={handleRerun} />

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Settings Panel (4 cols on lg, 3.5 on xl) */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            <SettingsPanel
              params={params}
              onChange={setParams}
              onApplyPreset={handleApplyPreset}
              onRerun={handleRerun}
            />

            <KellyInsightCard simulation={simulation} />
          </div>

          {/* Right Column: Visualization & Analytics (8 cols on lg, 8 on xl) */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            {/* Key Stats Panel */}
            <StatsPanel simulation={simulation} />

            {/* Overlaid Monte Carlo Equity Curves Chart */}
            <div className="h-[460px] sm:h-[500px]">
              <EquityChart simulation={simulation} />
            </div>

            {/* Outcome Distributions (Max Drawdowns & Final Equity Brackets) */}
            <DistributionHistograms simulation={simulation} />
          </div>
        </div>
      </main>

      {/* Footer System Status Bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-2.5 px-4 text-xs font-mono text-zinc-500">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-400">Engine Ready</span>
            </span>
            <span>·</span>
            <span>Bernoulli Geometric Compounding</span>
            <span>·</span>
            <span>Zero external API calls</span>
          </div>
          <div>
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">Re-Simulate</kbd> to generate alternate universe</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
