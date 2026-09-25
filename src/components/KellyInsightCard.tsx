import React from 'react';
import { SimulationResult } from '../utils/simulation';
import { formatPercent } from '../utils/formatters';
import { AlertCircle, BookOpen, ShieldAlert, Sparkles } from 'lucide-react';

interface KellyInsightCardProps {
  simulation: SimulationResult;
}

export const KellyInsightCard: React.FC<KellyInsightCardProps> = ({
  simulation,
}) => {
  const { params, stats } = simulation;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-xl text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            Compounding & Ruin Math
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          Geometric Expectancy
        </span>
      </div>

      <div className="space-y-2.5 text-zinc-300 leading-relaxed">
        {stats.isOverKelly ? (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/80 text-rose-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Over-betting Alert: </span>
              Your current risk of {params.riskPerTrade.toFixed(1)}% exceeds the full Kelly Criterion limit ({stats.kellyFraction.toFixed(1)}%). In geometric compounding, risking more than Kelly produces lower long-term geometric growth and guarantees eventual account ruin.
            </div>
          </div>
        ) : stats.expectedValuePerTrade <= 0 ? (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/80 text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Negative Expectancy: </span>
              With a {params.winRate}% win rate and {params.rewardToRisk}:1 R:R, the mathematical EV is {stats.expectedValuePerTrade.toFixed(2)}R. No position sizing strategy can survive negative mathematical expectancy over the long run.
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Positive Mathematical Edge: </span>
              Expected value is +{stats.expectedValuePerTrade.toFixed(2)}R per trade. Sizing at {params.riskPerTrade.toFixed(1)}% is {params.riskPerTrade <= stats.halfKellyFraction ? 'prudently within Half-Kelly' : 'below full Kelly'}, keeping compounding risk low.
            </div>
          </div>
        )}

        {/* Quick Asymmetric Drawdown Recovery Table */}
        <div className="pt-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Drawdown Recovery Asymmetry
          </div>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
              <div className="text-zinc-500">-10% DD</div>
              <div className="text-emerald-400 font-semibold">+11.1% gain</div>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
              <div className="text-zinc-500">-25% DD</div>
              <div className="text-amber-400 font-semibold">+33.3% gain</div>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
              <div className="text-zinc-500">-50% DD</div>
              <div className="text-rose-400 font-semibold">+100% gain</div>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
              <div className="text-zinc-500">-75% DD</div>
              <div className="text-rose-500 font-semibold">+300% gain</div>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
              <div className="text-zinc-500">-90% DD</div>
              <div className="text-red-600 font-semibold">+900% gain</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
