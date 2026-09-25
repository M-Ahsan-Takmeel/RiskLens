import React from 'react';
import { SimulationParams, PRESET_STRATEGIES } from '../utils/simulation';
import { formatCurrency } from '../utils/formatters';
import {
  Sliders,
  DollarSign,
  Percent,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SettingsPanelProps {
  params: SimulationParams;
  onChange: (updater: (prev: SimulationParams) => SimulationParams) => void;
  onApplyPreset: (presetId: string) => void;
  onRerun: () => void;
}

const STARTING_PRESETS = [5000, 10000, 25000, 50000, 100000, 250000];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  params,
  onChange,
  onApplyPreset,
  onRerun,
}) => {
  const updateParam = <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 space-y-4 shadow-xl">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            Simulation Parameters
          </h2>
        </div>
        <button
          onClick={onRerun}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded transition-colors"
          title="Re-run simulation with fresh random seed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-Simulate</span>
        </button>
      </div>

      {/* Preset Strategies Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Strategy Archetypes
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {PRESET_STRATEGIES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              className="px-2 py-1.5 text-left rounded bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 transition-colors group"
            >
              <div className="text-[11px] font-medium text-zinc-300 group-hover:text-emerald-400 truncate">
                {preset.name}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {preset.winRate}% W · {preset.rewardToRisk} R:R · {preset.riskPerTrade}%
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {/* Input 1: Risk Per Trade (%) - Highlighted as core driver */}
        <div className="p-3 rounded-lg bg-zinc-950/80 border border-emerald-500/20 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <span>Risk Per Trade</span>
              <span className="text-[10px] text-emerald-400 font-normal">
                (Compound rate per trade)
              </span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.1"
                max="20"
                step="0.1"
                value={params.riskPerTrade}
                onChange={(e) =>
                  updateParam('riskPerTrade', Math.max(0.1, Math.min(25, Number(e.target.value))))
                }
                className="w-16 px-1.5 py-0.5 text-right font-mono text-sm font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs font-mono text-zinc-400">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0.1"
            max="10.0"
            step="0.1"
            value={params.riskPerTrade}
            onChange={(e) => updateParam('riskPerTrade', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
            <span>0.1% (Safe)</span>
            <span>1.0% (Standard)</span>
            <span>2.5%</span>
            <span>5.0%</span>
            <span className="text-rose-400">10.0% (Danger)</span>
          </div>
        </div>

        {/* 2-Column Grid for Win Rate & Reward-to-Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Input 2: Win Rate (%) */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Win Rate (Probability)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  value={params.winRate}
                  onChange={(e) =>
                    updateParam('winRate', Math.max(1, Math.min(99, Number(e.target.value))))
                  }
                  className="w-14 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs font-mono text-zinc-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              step="1"
              value={params.winRate}
              onChange={(e) => updateParam('winRate', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>Trend (30%)</span>
              <span>Coin flip (50%)</span>
              <span>Scalp (70%)</span>
            </div>
          </div>

          {/* Input 3: Reward to Risk (R:R) */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Avg Reward-to-Risk (R:R)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0.2"
                  max="10"
                  step="0.1"
                  value={params.rewardToRisk}
                  onChange={(e) =>
                    updateParam('rewardToRisk', Math.max(0.1, Math.min(15, Number(e.target.value))))
                  }
                  className="w-14 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs font-mono text-zinc-400">:1</span>
              </div>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={params.rewardToRisk}
              onChange={(e) => updateParam('rewardToRisk', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>0.5:1</span>
              <span>1.5:1</span>
              <span>2.0:1 (2x)</span>
              <span>4.0:1 (4x)</span>
            </div>
          </div>
        </div>

        {/* Input 4: Starting Account Size ($) */}
        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-300">
              Starting Account Capital
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-zinc-400">$</span>
              <input
                type="number"
                min="500"
                max="10000000"
                step="1000"
                value={params.startingBalance}
                onChange={(e) =>
                  updateParam('startingBalance', Math.max(100, Number(e.target.value)))
                }
                className="w-24 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STARTING_PRESETS.map((amt) => (
              <button
                key={amt}
                onClick={() => updateParam('startingBalance', amt)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  params.startingBalance === amt
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {formatCurrency(amt, true)}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid for Trades Count & Simulated Curves Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Input 5: Number of Trades */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Trades Per Curve
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="20"
                  max="1000"
                  step="10"
                  value={params.numTrades}
                  onChange={(e) =>
                    updateParam('numTrades', Math.max(10, Math.min(1000, Number(e.target.value))))
                  }
                  className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={params.numTrades}
              onChange={(e) => updateParam('numTrades', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>50 trades</span>
              <span>100 trades</span>
              <span>250 trades</span>
              <span>500</span>
            </div>
          </div>

          {/* Input 6: Number of Simulated Curves */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Simulated Equity Curves (N)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  value={params.numCurves}
                  onChange={(e) =>
                    updateParam('numCurves', Math.max(20, Math.min(2000, Number(e.target.value))))
                  }
                  className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={params.numCurves}
              onChange={(e) => updateParam('numCurves', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>100</span>
              <span>250</span>
              <span>500 (Default)</span>
              <span>1,000</span>
            </div>
          </div>
        </div>

        {/* Input 7: Ruin Threshold (% Drawdown) */}
        <div className="p-3 rounded-lg bg-zinc-950/60 border border-rose-950/40">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Ruin Threshold Trigger</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-rose-400">-</span>
              <input
                type="number"
                min="10"
                max="99"
                step="5"
                value={params.ruinThresholdPct}
                onChange={(e) =>
                  updateParam('ruinThresholdPct', Math.max(5, Math.min(99, Number(e.target.value))))
                }
                className="w-14 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-zinc-900 border border-zinc-700 rounded text-rose-400 focus:outline-none focus:border-rose-500"
              />
              <span className="text-xs font-mono text-zinc-400">%</span>
            </div>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={params.ruinThresholdPct}
            onChange={(e) => updateParam('ruinThresholdPct', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
            <span>-20% (Conservative)</span>
            <span className="text-rose-400 font-semibold">-50% (Default Ruin)</span>
            <span>-80% (Catastrophic)</span>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-[11px]">
            <span className="text-zinc-500">Ruin Trigger Type:</span>
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
              <button
                onClick={() => updateParam('ruinMode', 'from_start')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  params.ruinMode === 'from_start'
                    ? 'bg-zinc-800 text-rose-300 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                From Starting Balance
              </button>
              <button
                onClick={() => updateParam('ruinMode', 'from_peak')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  params.ruinMode === 'from_peak'
                    ? 'bg-zinc-800 text-rose-300 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Peak Drawdown (Trailing)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
