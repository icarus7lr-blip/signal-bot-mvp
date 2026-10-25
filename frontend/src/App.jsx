import { useEffect, useState } from 'react';
import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await axios.get(`${apiBase}/api/dashboard`);
        setDashboard(data);
      } catch (error) {
        console.error('Dashboard fetch failed:', error);
      }

      try {
        const { data: simData } = await axios.post(`${apiBase}/api/simulate`);
        setSimulation(simData);
      } catch (error) {
        console.error('Simulation fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        Cargando dashboard...
      </div>
    );
  }

  const summary = dashboard?.summary ?? {};
  const traders = dashboard?.traders ?? [];
  const liveSignals = dashboard?.liveSignals ?? [];
  const recentTrades = dashboard?.recentTrades ?? [];
  const tokenMetrics = dashboard?.tokenMetrics ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-green-400">Signal Bot</p>
              <h1 className="mt-2 text-3xl font-bold">Trader Monitoring Dashboard</h1>
            </div>
            <div className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
              MVP online
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Total traders" value={summary.totalTraders ?? 0} tone="green" />
          <MetricCard label="Active" value={summary.activeTraders ?? 0} tone="blue" />
          <MetricCard label="Signals" value={summary.totalSignals ?? 0} tone="amber" />
          <MetricCard label="Open trades" value={summary.openTrades ?? 0} tone="purple" />
          <MetricCard label="PnL" value={`${Number(summary.totalPnl ?? 0).toFixed(4)}`} tone="red" />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-slate-950/40">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Traders</h2>
              <span className="text-sm text-slate-400">Avg win rate: {summary.avgWinRate ?? 0}%</span>
            </div>
            <div className="space-y-3">
              {traders.map((trader) => (
                <div key={trader.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div>
                    <p className="font-medium">{trader.name}</p>
                    <p className="text-sm text-slate-400">{trader.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">Win rate</p>
                    <p className="text-lg font-semibold text-green-400">{Number(trader.win_rate).toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-slate-950/40">
            <h2 className="mb-4 text-xl font-semibold">Next simulation</h2>
            {simulation ? (
              <div className="space-y-3 text-sm text-slate-300">
                <div className="rounded-xl bg-slate-950 p-3">
                  <span className="text-slate-400">Token:</span> <strong className="text-white">{simulation.token}</strong>
                </div>
                <div className="rounded-xl bg-slate-950 p-3">
                  <span className="text-slate-400">Entry:</span> <strong className="text-white">{Number(simulation.entryPrice).toFixed(6)}</strong>
                </div>
                <div className="rounded-xl bg-slate-950 p-3">
                  <span className="text-slate-400">Estimated exit:</span> <strong className="text-white">{Number(simulation.estimatedExitPrice).toFixed(6)}</strong>
                </div>
                <div className="rounded-xl bg-slate-950 p-3">
                  <span className="text-slate-400">PnL:</span> <strong className={simulation.status === 'profitable' ? 'text-green-400' : 'text-yellow-400'}>{Number(simulation.estimatedPnL).toFixed(2)}%</strong>
                </div>
                <div className="rounded-xl bg-slate-950 p-3">
                  <span className="text-slate-400">Status:</span> <strong className={simulation.status === 'profitable' ? 'text-green-400' : 'text-yellow-400'}>{simulation.status}</strong>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">No simulation available yet.</p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-semibold">Live signals</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Token</th>
                    <th className="pb-3">Trader</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSignals.map((signal) => (
                    <tr key={signal.id} className="border-t border-slate-800 align-top text-slate-200">
                      <td className="py-3">{signal.token}</td>
                      <td className="py-3">{signal.trader_id}</td>
                      <td className={`py-3 font-medium ${signal.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{signal.side}</td>
                      <td className="py-3">{Number(signal.price).toFixed(6)}</td>
                      <td className="py-3">{Number(signal.confidence).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-semibold">Token metrics</h2>
            <div className="space-y-3">
              {tokenMetrics.map((metric) => (
                <div key={metric.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{metric.token}</p>
                    <span className="text-xs text-slate-400">${Number(metric.price).toFixed(4)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>MCAP: ${Number(metric.market_cap).toLocaleString()}</span>
                    <span>LIQ: ${Number(metric.liquidity).toLocaleString()}</span>
                    <span>VOL: ${Number(metric.volume).toLocaleString()}</span>
                    <span>HOLD: {metric.holders}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold">Recent trade flow</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3">Token</th>
                  <th className="pb-3">Trader</th>
                  <th className="pb-3">Buy</th>
                  <th className="pb-3">Sell</th>
                  <th className="pb-3">PnL</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-t border-slate-800 align-top text-slate-200">
                    <td className="py-3">{trade.token}</td>
                    <td className="py-3">{trade.trader_id}</td>
                    <td className="py-3">{Number(trade.buy_price).toFixed(6)}</td>
                    <td className="py-3">{trade.sell_price ? Number(trade.sell_price).toFixed(6) : '—'}</td>
                    <td className={`py-3 font-medium ${Number(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl !== null ? Number(trade.pnl).toFixed(6) : '—'}</td>
                    <td className="py-3 uppercase">{trade.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const toneMap = {
    green: 'border-green-500/30 bg-green-500/10 text-green-300',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    amber: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return (
    <div className={`rounded-2xl border p-5 ${toneMap[tone]}`}>
      <p className="text-sm uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default App;
