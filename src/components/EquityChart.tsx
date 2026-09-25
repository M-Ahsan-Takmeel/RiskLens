import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { SimulationResult, PercentileStep } from '../utils/simulation';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  TrendingUp,
  AlertOctagon,
  Eye,
  Sliders,
  Layers,
  Percent,
} from 'lucide-react';

interface EquityChartProps {
  simulation: SimulationResult;
}

export const EquityChart: React.FC<EquityChartProps> = ({ simulation }) => {
  const { params, stats, curves, percentileSteps, ruinLevelPrice } = simulation;
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const [showPercentileBands, setShowPercentileBands] = useState(true);
  const [curveDisplayDensity, setCurveDisplayDensity] = useState<'all' | 'sample100' | 'sample30'>('all');
  const [highlightRuined, setHighlightRuined] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute domain bounds for Y axis
  const { yMin, yMax, yTicks } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;

    // Use percentile bounds + min/max with some safety padding
    for (const step of percentileSteps) {
      if (step.min < minVal) minVal = step.min;
      if (step.max > maxVal) maxVal = step.max;
    }

    if (minVal === Infinity) minVal = ruinLevelPrice * 0.8;
    if (maxVal === -Infinity) maxVal = params.startingBalance * 2;

    // Ensure ruin level and starting balance are within domain
    minVal = Math.min(minVal, ruinLevelPrice * 0.9);
    maxVal = Math.max(maxVal, params.startingBalance * 1.15);

    if (scaleType === 'log') {
      // In log scale, strictly positive
      minVal = Math.max(1, minVal);
      maxVal = Math.max(minVal * 1.5, maxVal);
    } else {
      // Linear
      minVal = Math.max(0, Math.floor(minVal * 0.9));
      maxVal = Math.ceil(maxVal * 1.05);
    }

    // Generate nice ticks for display
    return {
      yMin: minVal,
      yMax: maxVal,
      yTicks: undefined,
    };
  }, [percentileSteps, ruinLevelPrice, params.startingBalance, scaleType]);

  // Data for Recharts LineChart
  const rechartsData = useMemo(() => {
    return percentileSteps.map((step) => ({
      trade: step.trade,
      median: Math.round(step.median),
      p10: Math.round(step.p10),
      p25: Math.round(step.p25),
      p75: Math.round(step.p75),
      p90: Math.round(step.p90),
      mean: Math.round(step.mean),
      ruinRate: ((step.ruinCountAtStep / params.numCurves) * 100).toFixed(1),
    }));
  }, [percentileSteps, params.numCurves]);

  // Chart Margins matching Recharts
  const chartMargin = useMemo(
    () => ({ top: 16, right: 30, left: 16, bottom: 26 }),
    []
  );
  const yAxisWidth = 84;
  const xAxisHeight = 28;

  // Render high-performance overlaid curves on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Plot plotting area
    const plotLeft = chartMargin.left + yAxisWidth;
    const plotTop = chartMargin.top;
    const plotWidth = rect.width - plotLeft - chartMargin.right;
    const plotHeight = rect.height - plotTop - chartMargin.bottom - xAxisHeight;

    if (plotWidth <= 0 || plotHeight <= 0) return;

    const numTrades = params.numTrades;
    const isLog = scaleType === 'log';
    const logMin = Math.log(Math.max(1, yMin));
    const logMax = Math.log(Math.max(1, yMax));
    const logRange = logMax - logMin || 1;
    const linearRange = yMax - yMin || 1;

    const getX = (tradeIndex: number) => {
      return plotLeft + (tradeIndex / numTrades) * plotWidth;
    };

    const getY = (val: number) => {
      if (isLog) {
        const safeVal = Math.max(1, val);
        const norm = (Math.log(safeVal) - logMin) / logRange;
        return plotTop + plotHeight * (1 - Math.max(0, Math.min(1, norm)));
      } else {
        const norm = (val - yMin) / linearRange;
        return plotTop + plotHeight * (1 - Math.max(0, Math.min(1, norm)));
      }
    };

    // Determine curves to draw
    const totalCurves = curves.length;
    let step = 1;
    if (curveDisplayDensity === 'sample100' && totalCurves > 100) {
      step = Math.ceil(totalCurves / 100);
    } else if (curveDisplayDensity === 'sample30' && totalCurves > 30) {
      step = Math.ceil(totalCurves / 30);
    }

    // Set line opacity based on count
    const visibleCount = Math.ceil(totalCurves / step);
    let alpha = Math.max(0.04, Math.min(0.25, 12 / visibleCount));
    if (visibleCount <= 50) alpha = 0.22;
    if (visibleCount <= 20) alpha = 0.4;

    ctx.lineWidth = 1;

    // Batch draw curves: winners in subtle cyan/green, losers/ruined in subtle rose/red
    for (let c = 0; c < totalCurves; c += step) {
      const path = curves[c];
      const finalEq = path[numTrades];
      const hitRuin = simulation.finalEquities[c] <= ruinLevelPrice || path.some((v) => v <= ruinLevelPrice);

      ctx.beginPath();
      let isFirst = true;

      for (let t = 0; t <= numTrades; t++) {
        const px = getX(t);
        const py = getY(path[t]);
        if (isFirst) {
          ctx.moveTo(px, py);
          isFirst = false;
        } else {
          ctx.lineTo(px, py);
        }
      }

      if (hitRuin && highlightRuined) {
        ctx.strokeStyle = `rgba(244, 63, 94, ${alpha * 1.35})`; // rose-500
      } else if (finalEq >= params.startingBalance) {
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`; // emerald-400
      } else {
        ctx.strokeStyle = `rgba(161, 161, 170, ${alpha * 0.8})`; // zinc-400
      }

      ctx.stroke();
    }
  }, [
    curves,
    params,
    yMin,
    yMax,
    scaleType,
    curveDisplayDensity,
    highlightRuined,
    simulation.finalEquities,
    ruinLevelPrice,
    chartMargin,
    yAxisWidth,
    xAxisHeight,
  ]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-100 tracking-wide uppercase text-[11px]">
            Monte Carlo Equity Cloud
          </span>
          <span className="text-zinc-500 font-mono">
            ({params.numCurves} paths overlaid)
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-zinc-400">
          {/* Scale Toggle */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setScaleType('linear')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                scaleType === 'linear'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => setScaleType('log')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                scaleType === 'log'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Log (Compounding)
            </button>
          </div>

          {/* Density toggle */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setCurveDisplayDensity('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                curveDisplayDensity === 'all'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All {params.numCurves}
            </button>
            <button
              onClick={() => setCurveDisplayDensity('sample100')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                curveDisplayDensity === 'sample100'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              100 Sample
            </button>
          </div>

          {/* Percentile toggle */}
          <button
            onClick={() => setShowPercentileBands(!showPercentileBands)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              showPercentileBands
                ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>P10 / Median / P90</span>
          </button>

          {/* Ruined curve tint */}
          <button
            onClick={() => setHighlightRuined(!highlightRuined)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              highlightRuined
                ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Highlight paths that touched the ruin threshold in red"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Ruined Paths</span>
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div ref={containerRef} className="relative flex-1 min-h-[360px] w-full select-none">
        {/* Layer 1: HTML5 Canvas rendering all N translucent paths */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0"
        />

        {/* Layer 2: Recharts SVG for axes, grid, median/percentile lines, reference lines & tooltips */}
        <div className="absolute inset-0 z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rechartsData}
              margin={chartMargin}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={true}
                horizontal={true}
              />

              <XAxis
                dataKey="trade"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                height={xAxisHeight}
                tickFormatter={(val) => `T${val}`}
                domain={[0, params.numTrades]}
              />

              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                width={yAxisWidth}
                scale={scaleType === 'log' ? 'log' : 'linear'}
                domain={[yMin, yMax]}
                allowDataOverflow={true}
                tickFormatter={(val) => formatCurrency(val, true)}
              />

              {/* Reference line for Starting Account Balance */}
              <ReferenceLine
                y={params.startingBalance}
                stroke="#71717a"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Start: ${formatCurrency(params.startingBalance, true)}`,
                  fill: '#a1a1aa',
                  fontSize: 10,
                  position: 'insideTopLeft',
                  className: 'font-mono select-none',
                }}
              />

              {/* Reference line for Ruin Threshold */}
              <ReferenceLine
                y={ruinLevelPrice}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Ruin: ${formatCurrency(ruinLevelPrice, true)} (-${params.ruinThresholdPct}%)`,
                  fill: '#fb7185',
                  fontSize: 10,
                  position: 'insideBottomLeft',
                  className: 'font-mono font-semibold select-none',
                }}
              />

              <Tooltip
                content={<CustomChartTooltip startingBalance={params.startingBalance} />}
                isAnimationActive={false}
              />

              {/* Percentile Lines */}
              {showPercentileBands && (
                <>
                  {/* 90th percentile (Bull scenario) */}
                  <Line
                    type="monotone"
                    dataKey="p90"
                    name="90th Percentile"
                    stroke="#34d399"
                    strokeWidth={1.75}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                  />

                  {/* 75th percentile */}
                  <Line
                    type="monotone"
                    dataKey="p75"
                    name="75th Percentile"
                    stroke="#059669"
                    strokeWidth={1}
                    strokeOpacity={0.6}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {/* Median (50th percentile) */}
                  <Line
                    type="monotone"
                    dataKey="median"
                    name="Median Equity"
                    stroke="#38bdf8"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {/* 25th percentile */}
                  <Line
                    type="monotone"
                    dataKey="p25"
                    name="25th Percentile"
                    stroke="#e11d48"
                    strokeWidth={1}
                    strokeOpacity={0.6}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {/* 10th percentile (Bear scenario) */}
                  <Line
                    type="monotone"
                    dataKey="p10"
                    name="10th Percentile"
                    stroke="#f43f5e"
                    strokeWidth={1.75}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Footer Legend / Metric Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 bg-zinc-950/80 border-t border-zinc-800 text-[11px] font-mono">
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#38bdf8] inline-block"></span>
            <span className="text-zinc-300">Median Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#34d399] inline-block border-b border-dashed border-emerald-400"></span>
            <span className="text-zinc-300">90th Percentile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#f43f5e] inline-block border-b border-dashed border-rose-500"></span>
            <span className="text-zinc-300">10th Percentile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 inline-block border-b-2 border-dashed border-rose-600"></span>
            <span className="text-rose-400 font-medium">Ruin Barrier ({formatCurrency(ruinLevelPrice)})</span>
          </div>
        </div>

        <div className="text-zinc-400">
          Spread: <span className="text-rose-400">{formatCurrency(stats.p10FinalEquity)}</span>
          {' → '}
          <span className="text-sky-400 font-semibold">{formatCurrency(stats.medianFinalEquity)}</span>
          {' → '}
          <span className="text-emerald-400">{formatCurrency(stats.p90FinalEquity)}</span>
        </div>
      </div>
    </div>
  );
};

// Custom interactive tooltip
const CustomChartTooltip = ({ active, payload, label, startingBalance }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const tradeNum = label;
  const median = data.median;
  const p90 = data.p90;
  const p10 = data.p10;
  const medianPnlPct = ((median - startingBalance) / startingBalance) * 100;

  return (
    <div className="bg-zinc-950/95 border border-zinc-700/80 rounded p-3 shadow-xl backdrop-blur-md text-xs font-mono min-w-[210px] pointer-events-none">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-800">
        <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-sans font-semibold">
          Trade #{tradeNum}
        </span>
        <span
          className={`font-semibold ${
            medianPnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {formatPercent(medianPnlPct, true)}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Median Equity:</span>
          <span className="text-sky-300 font-semibold">{formatCurrency(median)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400">90th Percentile:</span>
          <span className="text-emerald-400">{formatCurrency(p90)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400">10th Percentile:</span>
          <span className="text-rose-400">{formatCurrency(p10)}</span>
        </div>

        <div className="pt-1 mt-1 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Ruined Curves:</span>
          <span className="text-rose-400 font-medium">{data.ruinRate}%</span>
        </div>
      </div>
    </div>
  );
};
