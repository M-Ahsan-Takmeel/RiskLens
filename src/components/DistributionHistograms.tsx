import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { SimulationResult } from '../utils/simulation';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { BarChart3, PieChart, Info } from 'lucide-react';

interface HistogramBin {
  range: string;
  count: number;
  color: string;
  percentage: string;
  isRuin?: boolean;
}

interface DistributionHistogramsProps {
  simulation: SimulationResult;
}

export const DistributionHistograms: React.FC<DistributionHistogramsProps> = ({
  simulation,
}) => {
  const { params, finalEquities, maxDrawdowns, ruinLevelPrice } = simulation;
  const [activeTab, setActiveTab] = useState<'drawdowns' | 'finalEquities'>('drawdowns');

  // Max Drawdown Bins
  const drawdownBinsData = useMemo<HistogramBin[]>(() => {
    const bins = [
      { range: '0-10%', min: 0, max: 10, count: 0, color: '#34d399' },
      { range: '10-20%', min: 10, max: 20, count: 0, color: '#10b981' },
      { range: '20-30%', min: 20, max: 30, count: 0, color: '#38bdf8' },
      { range: '30-40%', min: 30, max: 40, count: 0, color: '#f59e0b' },
      { range: '40-50%', min: 40, max: 50, count: 0, color: '#fb923c' },
      { range: '50-65%', min: 50, max: 65, count: 0, color: '#f87171' },
      { range: '65-80%', min: 65, max: 80, count: 0, color: '#ef4444' },
      { range: '80%+', min: 80, max: 100, count: 0, color: '#991b1b' },
    ];

    for (const dd of maxDrawdowns) {
      for (const bin of bins) {
        if (dd >= bin.min && (dd < bin.max || (bin.max === 100 && dd <= 100))) {
          bin.count++;
          break;
        }
      }
    }

    return bins.map((b) => ({
      range: b.range,
      count: b.count,
      color: b.color,
      percentage: ((b.count / params.numCurves) * 100).toFixed(1),
    }));
  }, [maxDrawdowns, params.numCurves]);

  // Final Equity Bins
  const equityBinsData = useMemo<HistogramBin[]>(() => {
    const start = params.startingBalance;
    const bins = [
      {
        range: 'Ruined (≤-' + params.ruinThresholdPct + '%)',
        count: 0,
        color: '#dc2626',
        isRuin: true,
      },
      { range: 'Loss (-' + params.ruinThresholdPct + '% to 0%)', count: 0, color: '#f87171', isRuin: false },
      { range: 'Break-even / 1.0x-1.5x', count: 0, color: '#38bdf8', isRuin: false },
      { range: 'Solid Gain 1.5x-2.5x', count: 0, color: '#34d399', isRuin: false },
      { range: 'High Return 2.5x-5.0x', count: 0, color: '#10b981', isRuin: false },
      { range: 'Outlier 5.0x+', count: 0, color: '#059669', isRuin: false },
    ];

    for (const eq of finalEquities) {
      if (eq <= ruinLevelPrice) {
        bins[0].count++;
      } else if (eq < start) {
        bins[1].count++;
      } else if (eq <= start * 1.5) {
        bins[2].count++;
      } else if (eq <= start * 2.5) {
        bins[3].count++;
      } else if (eq <= start * 5.0) {
        bins[4].count++;
      } else {
        bins[5].count++;
      }
    }

    return bins.map((b) => ({
      range: b.range,
      count: b.count,
      color: b.color,
      isRuin: b.isRuin,
      percentage: ((b.count / params.numCurves) * 100).toFixed(1),
    }));
  }, [finalEquities, params, ruinLevelPrice]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            Outcome Distributions
          </h3>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('drawdowns')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'drawdowns'
                ? 'bg-zinc-800 text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Max Drawdown
          </button>
          <button
            onClick={() => setActiveTab('finalEquities')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'finalEquities'
                ? 'bg-zinc-800 text-sky-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Final Equity Brackets
          </button>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={activeTab === 'drawdowns' ? drawdownBinsData : equityBinsData}
            margin={{ top: 8, right: 12, left: -16, bottom: 20 }}
          >
            <XAxis
              dataKey="range"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#3f3f46' }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#3f3f46' }}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-zinc-950 border border-zinc-700 rounded p-2 text-xs font-mono shadow-lg">
                    <div className="text-zinc-300 font-semibold mb-1">{d.range}</div>
                    <div className="text-zinc-400">
                      Curves: <span className="text-white font-bold">{d.count}</span> ({d.percentage}%)
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {(activeTab === 'drawdowns' ? drawdownBinsData : equityBinsData).map(
                (entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                )
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Info className="w-3.5 h-3.5 text-zinc-500" />
          <span>
            {activeTab === 'drawdowns'
              ? 'Peak-to-trough decline experienced during simulated trade sequence'
              : 'End-of-simulation equity multiplier compared to starting deposit'}
          </span>
        </div>
      </div>
    </div>
  );
};
