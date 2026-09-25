# RiskLens — Risk of Ruin & Monte Carlo Simulator

A high-performance, client-side Monte Carlo risk analysis and equity curve simulation tool engineered for quantitative and discretionary traders.

RiskLens models the mathematical reality of sequential trade distribution, high-water mark drawdowns, and geometric compounding to calculate empirical probabilities of account ruin before real capital is put at risk.

---

## Key Features

- **Geometric Compounding Engine**: Realistically compounds every trade's return against current account equity rather than linear fixed-dollar balance additions.
- **Monte Carlo Multi-Curve Cloud**: Simulates up to 2,000 independent alternate trading universe trajectories simultaneously.
- **Probability of Ruin Calculation**: Accurately computes the exact percentage of equity paths that touch a catastrophic drawdown barrier (default $-50\%$) at any point during a trading sequence.
- **Dual-Layer High-Performance Charting**: Combines a high-DPI HTML5 Canvas layer rendering hundreds of translucent equity paths with an SVG overlay for confidence bands (P10, P25, Median, P75, P90) and interactive tooltips.
- **Linear & Logarithmic Compounding Scales**: Toggle between standard linear equity scaling and logarithmic scaling to visualize geometric growth and downside tail risks.
- **Kelly Criterion & Over-betting Guard**: Compares current position sizing against full and half Kelly fractions to prevent geometric over-betting traps.
- **Live Debounced Slider Reactivity**: Dragging parameters (risk per trade, win rate, R:R) triggers instant 60fps UI updates and throttled background recalculation without main-thread stutter.
- **Outcome Distribution Histograms**: Binned frequency analysis of maximum peak-to-trough drawdowns and terminal equity multiples.
- **Zero Backend / 100% Client-Side**: Completely self-contained, privacy-preserving, and offline-capable with zero external API calls.
- **CSV Data Export**: Instant download of all simulation metrics, percentile points, and risk metrics.

---

## Mathematical Formulation

### 1. Trade Generation & Compounding
For each curve $c$ and trade $t \in [1, T]$, outcome is modeled via a Bernoulli random variable:

$$\text{Trade Outcome} = \begin{cases} \text{Win} & \text{with probability } p = \frac{\text{WinRate}}{100} \\ \text{Loss} & \text{with probability } 1 - p \end{cases}$$

Compounded equity at step $t$:

$$E_{t} = E_{t-1} \times \begin{cases} 1 + \left( R\text{:}R \times \frac{\text{RiskPct}}{100} \right) & \text{if Win} \\ 1 - \frac{\text{RiskPct}}{100} & \text{if Loss} \end{cases}$$

### 2. High-Water Mark & Drawdown
$$\text{Peak}_t = \max(\text{Peak}_{t-1}, E_t)$$
$$\text{Drawdown}_t = \frac{\text{Peak}_t - E_t}{\text{Peak}_t}$$
$$\text{MaxDrawdown}_c = \max_{t \in [0, T]} (\text{Drawdown}_t)$$

### 3. Probability of Ruin
A curve is marked ruined if at any trade $t$:
$$E_t \le E_0 \times \left(1 - \frac{\text{RuinThresholdPct}}{100}\right)$$

$$\text{Probability of Ruin} = \frac{\sum_{c=1}^{N} \mathbb{I}(\text{Curve}_c \text{ hit ruin})}{N} \times 100\%$$

### 4. Kelly Criterion & Expected Value ($EV$)
$$EV = (p \times R\text{:}R) - (1 - p)$$
$$K^* = \frac{p \times (R\text{:}R + 1) - 1}{R\text{:}R}$$

---

## Strategy Presets Included

| Strategy | Win Rate | Reward:Risk | Risk/Trade | Trade Count | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Classic Swing** | 50% | 2.0:1 | 1.0% | 100 | Balanced baseline with steady compounding |
| **Trend Follower** | 38% | 3.5:1 | 1.5% | 150 | Asymmetric payoff distribution with low win-rate tolerance |
| **Mean Reversion** | 68% | 1.1:1 | 0.5% | 200 | High-frequency scalping with tight stops |
| **Overleveraged** | 45% | 1.8:1 | 6.0% | 100 | Demonstrates the ruin trap of sizing beyond the Kelly limit |
| **Turtle / Breakout**| 30% | 4.5:1 | 1.0% | 120 | Wide runner-capture system |

---

## Tech Stack

- **Framework**: React 19 (TypeScript)
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4
- **Typography**: JetBrains Mono (tabular figures) & Plus Jakarta Sans
- **Visuals**: Recharts + HTML5 Canvas 2D API
- **Icons**: Lucide React
- **Performance**: `Float64Array` typed buffer memory allocation & 40ms input debouncing

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/risklens.git

# Navigate into project directory
cd risklens

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Production Build
```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## License

Apache-2.0 License. Free for personal, commercial, and research use.
