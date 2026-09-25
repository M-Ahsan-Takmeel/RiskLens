export interface SimulationParams {
  winRate: number; // 0 to 100 (%)
  rewardToRisk: number; // e.g. 2.0
  startingBalance: number; // e.g. 10000 ($)
  riskPerTrade: number; // 0.1 to 10 (%)
  numTrades: number; // e.g. 100
  numCurves: number; // e.g. 500
  ruinThresholdPct: number; // e.g. 50 (%) -> ruin at balance <= startingBalance * (1 - ruinThresholdPct/100)
  ruinMode: 'from_start' | 'from_peak'; // default 'from_start'
}

export interface SimulationStats {
  medianFinalEquity: number;
  meanFinalEquity: number;
  p10FinalEquity: number;
  p25FinalEquity: number;
  p75FinalEquity: number;
  p90FinalEquity: number;
  minFinalEquity: number;
  maxFinalEquity: number;
  
  probabilityOfRuin: number; // 0 - 100 %
  curvesRuinedCount: number;
  
  medianMaxDrawdown: number; // 0 - 100 %
  worstMaxDrawdown: number; // 0 - 100 %
  p10MaxDrawdown: number; // 0 - 100 %
  p90MaxDrawdown: number; // 0 - 100 %
  
  probabilityOfProfit: number; // 0 - 100 %
  expectedValuePerTrade: number; // EV in units of risk R: (winRate * R:R) - ((1 - winRate) * 1)
  expectedReturnPerTradePct: number; // (EV * riskPerTrade)%
  kellyFraction: number; // full kelly %
  halfKellyFraction: number; // half kelly %
  isOverKelly: boolean;

  executionTimeMs: number;
}

export interface PercentileStep {
  trade: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  mean: number;
  min: number;
  max: number;
  ruinCountAtStep: number;
}

export interface SimulationResult {
  params: SimulationParams;
  stats: SimulationStats;
  // Matrix of equity curves: [curveIndex][tradeIndex 0..numTrades]
  curves: Float64Array[];
  // Summary percentile path for each trade step 0..numTrades
  percentileSteps: PercentileStep[];
  // Distribution of final equities for histogram
  finalEquities: number[];
  // Distribution of max drawdowns (0 to 100%)
  maxDrawdowns: number[];
  ruinLevelPrice: number;
}

/**
 * Fast Monte Carlo simulation engine
 */
export function runMonteCarloSimulation(params: SimulationParams): SimulationResult {
  const startTime = performance.now();
  const {
    winRate,
    rewardToRisk,
    startingBalance,
    riskPerTrade,
    numTrades,
    numCurves,
    ruinThresholdPct,
    ruinMode = 'from_start',
  } = params;

  const winProb = Math.max(0, Math.min(100, winRate)) / 100;
  const riskFraction = Math.max(0.0001, riskPerTrade / 100);
  const winMultiplier = 1 + rewardToRisk * riskFraction;
  const lossMultiplier = Math.max(0, 1 - riskFraction);

  const ruinLevelPrice = startingBalance * (1 - ruinThresholdPct / 100);

  const curves: Float64Array[] = new Array(numCurves);
  const finalEquities: number[] = new Array(numCurves);
  const maxDrawdowns: number[] = new Array(numCurves);

  let ruinedCurvesCount = 0;

  // We can also aggregate percentiles per trade step.
  // To avoid allocating massive arrays if numTrades * numCurves is large,
  // we record all curves in Float64Array.
  for (let c = 0; c < numCurves; c++) {
    const path = new Float64Array(numTrades + 1);
    path[0] = startingBalance;
    let currentEquity = startingBalance;
    let peakEquity = startingBalance;
    let maxDd = 0;
    let hitRuin = false;

    for (let t = 1; t <= numTrades; t++) {
      // Bernoulli trade trial
      const isWin = Math.random() < winProb;
      if (isWin) {
        currentEquity *= winMultiplier;
      } else {
        currentEquity *= lossMultiplier;
      }

      // Check peak & drawdown
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      } else {
        const dd = (peakEquity - currentEquity) / peakEquity;
        if (dd > maxDd) {
          maxDd = dd;
        }
      }

      // Check ruin
      if (!hitRuin) {
        if (ruinMode === 'from_start') {
          if (currentEquity <= ruinLevelPrice) {
            hitRuin = true;
          }
        } else {
          // from peak
          const ddFromPeakPct = ((peakEquity - currentEquity) / peakEquity) * 100;
          if (ddFromPeakPct >= ruinThresholdPct) {
            hitRuin = true;
          }
        }
      }

      path[t] = currentEquity;
    }

    if (hitRuin) {
      ruinedCurvesCount++;
    }

    curves[c] = path;
    finalEquities[c] = currentEquity;
    maxDrawdowns[c] = maxDd * 100; // in percent
  }

  // Calculate sorted distributions for final equities
  const sortedFinals = [...finalEquities].sort((a, b) => a - b);
  const sortedDrawdowns = [...maxDrawdowns].sort((a, b) => a - b);

  const getPercentile = (sortedArr: number[], p: number): number => {
    if (sortedArr.length === 0) return 0;
    const index = (p / 100) * (sortedArr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
  };

  const medianFinal = getPercentile(sortedFinals, 50);
  const meanFinal = finalEquities.reduce((acc, v) => acc + v, 0) / numCurves;
  const p10Final = getPercentile(sortedFinals, 10);
  const p25Final = getPercentile(sortedFinals, 25);
  const p75Final = getPercentile(sortedFinals, 75);
  const p90Final = getPercentile(sortedFinals, 90);
  const minFinal = sortedFinals[0];
  const maxFinal = sortedFinals[sortedFinals.length - 1];

  const medianMaxDd = getPercentile(sortedDrawdowns, 50);
  const worstMaxDd = sortedDrawdowns[sortedDrawdowns.length - 1];
  const p10MaxDd = getPercentile(sortedDrawdowns, 10);
  const p90MaxDd = getPercentile(sortedDrawdowns, 90);

  const profitableCount = finalEquities.filter((eq) => eq > startingBalance).length;
  const probabilityOfProfit = (profitableCount / numCurves) * 100;
  const probabilityOfRuin = (ruinedCurvesCount / numCurves) * 100;

  // Expected value in R-multiples: E(R) = (p * b) - (q * 1)
  const lossProb = 1 - winProb;
  const evInR = winProb * rewardToRisk - lossProb * 1.0;
  const expectedReturnPerTradePct = evInR * riskPerTrade;

  // Kelly Criterion: K = W - (1-W)/R = (W*(R+1) - 1) / R
  let kellyFraction = 0;
  if (rewardToRisk > 0) {
    kellyFraction = (winProb * (rewardToRisk + 1) - 1) / rewardToRisk;
  }
  const kellyPercent = Math.max(0, kellyFraction * 100);
  const halfKellyPercent = kellyPercent / 2;
  const isOverKelly = riskPerTrade > kellyPercent && kellyPercent > 0;

  // Compute percentile curves for each trade step
  const percentileSteps: PercentileStep[] = new Array(numTrades + 1);
  const stepValues = new Float64Array(numCurves);

  for (let t = 0; t <= numTrades; t++) {
    let sum = 0;
    let minAtStep = Infinity;
    let maxAtStep = -Infinity;
    let ruinAtStep = 0;

    for (let c = 0; c < numCurves; c++) {
      const val = curves[c][t];
      stepValues[c] = val;
      sum += val;
      if (val < minAtStep) minAtStep = val;
      if (val > maxAtStep) maxAtStep = val;
      if (val <= ruinLevelPrice) ruinAtStep++;
    }

    // Sort step values to extract percentiles
    stepValues.sort();

    percentileSteps[t] = {
      trade: t,
      p10: stepValues[Math.floor(0.1 * (numCurves - 1))],
      p25: stepValues[Math.floor(0.25 * (numCurves - 1))],
      median: stepValues[Math.floor(0.5 * (numCurves - 1))],
      p75: stepValues[Math.floor(0.75 * (numCurves - 1))],
      p90: stepValues[Math.floor(0.9 * (numCurves - 1))],
      mean: sum / numCurves,
      min: minAtStep,
      max: maxAtStep,
      ruinCountAtStep: ruinAtStep,
    };
  }

  const endTime = performance.now();

  return {
    params,
    stats: {
      medianFinalEquity: medianFinal,
      meanFinalEquity: meanFinal,
      p10FinalEquity: p10Final,
      p25FinalEquity: p25Final,
      p75FinalEquity: p75Final,
      p90FinalEquity: p90Final,
      minFinalEquity: minFinal,
      maxFinalEquity: maxFinal,
      probabilityOfRuin,
      curvesRuinedCount: ruinedCurvesCount,
      medianMaxDrawdown: medianMaxDd,
      worstMaxDrawdown: worstMaxDd,
      p10MaxDrawdown: p10MaxDd,
      p90MaxDrawdown: p90MaxDd,
      probabilityOfProfit,
      expectedValuePerTrade: evInR,
      expectedReturnPerTradePct,
      kellyFraction: kellyPercent,
      halfKellyFraction: halfKellyPercent,
      isOverKelly,
      executionTimeMs: Math.round(endTime - startTime),
    },
    curves,
    percentileSteps,
    finalEquities,
    maxDrawdowns,
    ruinLevelPrice,
  };
}

export interface PresetStrategy {
  id: string;
  name: string;
  description: string;
  winRate: number;
  rewardToRisk: number;
  riskPerTrade: number;
  numTrades: number;
  ruinThresholdPct: number;
}

export const PRESET_STRATEGIES: PresetStrategy[] = [
  {
    id: 'classic_swing',
    name: 'Classic Swing Trader',
    description: 'Balanced 1:2 R:R with 50% win rate and 1% risk per trade.',
    winRate: 50,
    rewardToRisk: 2.0,
    riskPerTrade: 1.0,
    numTrades: 100,
    ruinThresholdPct: 50,
  },
  {
    id: 'trend_follower',
    name: 'Trend Follower',
    description: 'Low win rate (38%), wide asymmetrical winners (3.5 R:R).',
    winRate: 38,
    rewardToRisk: 3.5,
    riskPerTrade: 1.5,
    numTrades: 150,
    ruinThresholdPct: 50,
  },
  {
    id: 'scalper_reversion',
    name: 'Mean Reversion Scalper',
    description: 'High win rate (68%), tighter R:R (1.1) and 0.5% risk.',
    winRate: 68,
    rewardToRisk: 1.1,
    riskPerTrade: 0.5,
    numTrades: 200,
    ruinThresholdPct: 40,
  },
  {
    id: 'overleveraged_gambler',
    name: 'Aggressive / Overleveraged',
    description: '45% win rate, 1.8 R:R, but 6.0% risk per trade (over Kelly).',
    winRate: 45,
    rewardToRisk: 1.8,
    riskPerTrade: 6.0,
    numTrades: 100,
    ruinThresholdPct: 50,
  },
  {
    id: 'turtle_trader',
    name: 'Turtle / Breakout',
    description: '30% win rate with monster runners (4.5 R:R) and disciplined 1.0% risk.',
    winRate: 30,
    rewardToRisk: 4.5,
    riskPerTrade: 1.0,
    numTrades: 120,
    ruinThresholdPct: 50,
  },
];
