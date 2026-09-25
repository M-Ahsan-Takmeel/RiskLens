import React from 'react';
import { SimulationResult } from '../utils/simulation';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Activity,
  Download,
  RotateCcw,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface HeaderProps {
  simulation: SimulationResult;
  onRerun: () => void;
}

export const Header: React.FC<HeaderProps> = ({ simulation, onRerun }) => {
  const { params, stats } = simulation;

  const exportSummaryCsv = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Win Rate (%)', params.winRate],
      ['Reward to Risk (R:R)', params.rewardToRisk],
      ['Risk Per Trade (%)', params.riskPerTrade],
      ['Starting Account ($)', params.startingBalance],
      ['Trades per Curve', params.numTrades],
      ['Number of Curves', params.numCurves],
      ['Ruin Threshold (%)', params.ruinThresholdPct],
      ['Probability of Ruin (%)', stats.probabilityOfRuin.toFixed(2)],
      ['Ruined Curves Count', stats.curvesRuinedCount],
      ['Median Final Equity ($)', stats.medianFinalEquity.toFixed(2)],
      ['10th Percentile Final ($)', stats.p10FinalEquity.toFixed(2)],
      ['90th Percentile Final ($)', stats.p90FinalEquity.toFixed(2)],
      ['Median Max Drawdown (%)', stats.medianMaxDrawdown.toFixed(2)],
      ['Worst Max Drawdown (%)', stats.worstMaxDrawdown.toFixed(2)],
      ['Expected Value (R)', stats.expectedValuePerTrade.toFixed(3)],
      ['Kelly Criterion (%)', stats.kellyFraction.toFixed(2)],
      ['Probability of Profit (%)', stats.probabilityOfProfit.toFixed(2)],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `risklens-simulation-${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-zinc-100 tracking-tight font-sans">
                RiskLens
              </h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Monte Carlo v2.4
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span>Risk of Ruin Simulator</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-semibold">{params.numCurves} paths</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{params.numTrades} trades/run</span>
            </div>
          </div>
        </div>

        {/* Live Status Readout & Export */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-zinc-500">Ruin Prob: </span>
              <span
                className={`font-bold ${
                  stats.probabilityOfRuin > 15
                    ? 'text-rose-400'
                    : stats.probabilityOfRuin > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {stats.probabilityOfRuin.toFixed(1)}%
              </span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              <span className="text-zinc-500">Median Eq: </span>
              <span className="text-sky-300 font-bold">
                {formatCurrency(stats.medianFinalEquity, true)}
              </span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              <span className="text-zinc-500">Worst DD: </span>
              <span className="text-rose-400 font-bold">
                -{stats.worstMaxDrawdown.toFixed(1)}%
              </span>
            </div>
          </div>

          <button
            onClick={exportSummaryCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors"
            title="Export simulation summary statistics to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onRerun}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors active:scale-95"
            title="Generate new Monte Carlo paths with random seed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-Simulate</span>
          </button>
        </div>
      </div>
    </header>
  );
};
