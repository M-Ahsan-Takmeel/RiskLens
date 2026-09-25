import React from 'react';
import { SimulationResult } from '../utils/simulation';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Percent,
  TrendingDown,
  Target,
  Zap,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface StatsPanelProps {
  simulation: SimulationResult;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ simulation }) => {
  const { params, stats, ruinLevelPrice } = simulation;

  const medianReturnPct =
    ((stats.medianFinalEquity - params.startingBalance) / params.startingBalance) * 100;
  const p10ReturnPct =
    ((stats.p10FinalEquity - params.startingBalance) / params.startingBalance) * 100;
  const p90ReturnPct =
    ((stats.p90FinalEquity - params.startingBalance) / params.startingBalance) * 100;

  // Ruin severity rating
  const ruinSeverity =
    stats.probabilityOfRuin === 0
      ? 'safe'
      : stats.probabilityOfRuin < 5
      ? 'low'
      : stats.probabilityOfRuin < 20
      ? 'moderate'
      : 'high';

  return (
    <div className="space-y-3">
      {/* Primary Key Stats 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Probability of Ruin (User requirement) */}
        <div
          className={`p-3.5 rounded-lg border transition-colors ${
            stats.probabilityOfRuin > 15
              ? 'bg-rose-950/30 border-rose-800/80 text-rose-100'
              : stats.probabilityOfRuin > 0
              ? 'bg-amber-950/20 border-amber-800/70 text-amber-100'
              : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Probability of Ruin
            </span>
            {stats.probabilityOfRuin > 15 ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : stats.probabilityOfRuin > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl font-bold tracking-tight ${
                stats.probabilityOfRuin > 15
                  ? 'text-rose-400'
                  : stats.probabilityOfRuin > 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {stats.probabilityOfRuin.toFixed(1)}%
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              ({stats.curvesRuinedCount}/{params.numCurves} paths)
            </span>
          </div>

          <div className="mt-1 text-[11px] text-zinc-400 leading-tight">
            Hit <span className="font-mono text-zinc-200">{formatCurrency(ruinLevelPrice)}</span> (-{params.ruinThresholdPct}%) at any point
          </div>
        </div>

        {/* Metric 2: Median Final Equity (User requirement) */}
        <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Median Final Equity
            </span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-sky-300 tracking-tight">
              {formatCurrency(stats.medianFinalEquity)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span
              className={`font-semibold ${
                medianReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPercent(medianReturnPct, true)}
            </span>
            <span className="text-zinc-500">vs start</span>
            <span className="text-zinc-500 font-sans">·</span>
            <span className="text-zinc-400">Mean: {formatCurrency(stats.meanFinalEquity, true)}</span>
          </div>
        </div>

        {/* Metric 3: 10th / 90th Percentile Spread (User requirement) */}
        <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              10th / 90th Percentile
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between font-mono pt-0.5">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">10th (Floor)</div>
              <div className="text-sm font-bold text-rose-400">
                {formatCurrency(stats.p10FinalEquity)}
              </div>
              <div className="text-[10px] text-zinc-400">
                {formatPercent(p10ReturnPct, true)}
              </div>
            </div>

            <div className="h-8 w-px bg-zinc-800" />

            <div className="text-right">
              <div className="text-[10px] text-zinc-500 uppercase">90th (Ceiling)</div>
              <div className="text-sm font-bold text-emerald-400">
                {formatCurrency(stats.p90FinalEquity)}
              </div>
              <div className="text-[10px] text-zinc-400">
                {formatPercent(p90ReturnPct, true)}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Max Drawdown Distribution (User requirement) */}
        <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Max Drawdown (Peak-to-Trough)
            </span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>

          <div className="flex items-center justify-between font-mono pt-0.5">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Median Max DD</div>
              <div className="text-base font-bold text-amber-400">
                -{stats.medianMaxDrawdown.toFixed(1)}%
              </div>
              <div className="text-[10px] text-zinc-500">P10: -{stats.p10MaxDrawdown.toFixed(1)}%</div>
            </div>

            <div className="h-8 w-px bg-zinc-800" />

            <div className="text-right">
              <div className="text-[10px] text-zinc-500 uppercase">Worst-Case DD</div>
              <div className="text-base font-bold text-rose-500">
                -{stats.worstMaxDrawdown.toFixed(1)}%
              </div>
              <div className="text-[10px] text-zinc-500">P90: -{stats.p90MaxDrawdown.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Edge & Risk Analysis Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800/80 rounded-md text-xs font-mono">
        {/* EV per Trade */}
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase font-sans">
            Expected Value (Edge)
          </span>
          <span
            className={`font-semibold ${
              stats.expectedValuePerTrade > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.expectedValuePerTrade > 0 ? '+' : ''}
            {stats.expectedValuePerTrade.toFixed(2)} R / trade
          </span>
          <span className="text-[10px] text-zinc-500">
            Avg: {stats.expectedReturnPerTradePct > 0 ? '+' : ''}
            {stats.expectedReturnPerTradePct.toFixed(2)}% equity / trade
          </span>
        </div>

        {/* Kelly Criterion */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 uppercase font-sans">
              Optimal Kelly %
            </span>
            {stats.isOverKelly && (
              <span className="text-[9px] px-1 bg-rose-950 text-rose-400 border border-rose-800 rounded font-sans">
                OVER-BETTING
              </span>
            )}
          </div>
          <span className="font-semibold text-zinc-200">
            {stats.kellyFraction.toFixed(1)}% full · {stats.halfKellyFraction.toFixed(1)}% half
          </span>
          <span
            className={`text-[10px] ${
              stats.isOverKelly ? 'text-rose-400 font-bold' : 'text-zinc-500'
            }`}
          >
            Current risk: {params.riskPerTrade.toFixed(1)}% {stats.isOverKelly ? '(Exceeds Kelly!)' : '(Safe)'}
          </span>
        </div>

        {/* Profit Probability */}
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase font-sans">
            Profitable Outcomes
          </span>
          <span
            className={`font-semibold ${
              stats.probabilityOfProfit >= 50 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {stats.probabilityOfProfit.toFixed(1)}%
          </span>
          <span className="text-[10px] text-zinc-500">
            Finished above {formatCurrency(params.startingBalance, true)}
          </span>
        </div>

        {/* Extreme Range */}
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase font-sans">
            Extreme Outliers
          </span>
          <span className="text-zinc-300 font-semibold truncate">
            {formatCurrency(stats.minFinalEquity, true)} min · {formatCurrency(stats.maxFinalEquity, true)} max
          </span>
          <span className="text-[10px] text-zinc-500">
            Simulated in {stats.executionTimeMs}ms
          </span>
        </div>
      </div>
    </div>
  );
};
