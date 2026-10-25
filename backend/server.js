import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3001);
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/signalbot';

const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
});

app.use(cors());
app.use(express.json());

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS traders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      status VARCHAR(30) DEFAULT 'active',
      win_rate NUMERIC(5,2) DEFAULT 0,
      confidence NUMERIC(5,2) DEFAULT 0,
      last_signal_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id SERIAL PRIMARY KEY,
      trader_id INT NOT NULL,
      token VARCHAR(100) NOT NULL,
      pair VARCHAR(50) NOT NULL,
      side VARCHAR(20) NOT NULL,
      price NUMERIC(20,8) NOT NULL,
      market_cap NUMERIC(20,2) NOT NULL,
      liquidity NUMERIC(20,2) NOT NULL,
      volume NUMERIC(20,2) NOT NULL,
      holders INT NOT NULL,
      confidence NUMERIC(5,2) NOT NULL,
      event_time TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      trader_id INT NOT NULL,
      token VARCHAR(100) NOT NULL,
      side VARCHAR(20) NOT NULL,
      buy_price NUMERIC(20,8) NOT NULL,
      sell_price NUMERIC(20,8),
      pnl NUMERIC(20,8),
      status VARCHAR(30) DEFAULT 'open',
      opened_at TIMESTAMP DEFAULT NOW(),
      closed_at TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_metrics (
      id SERIAL PRIMARY KEY,
      token VARCHAR(100) NOT NULL,
      market_cap NUMERIC(20,2) NOT NULL,
      liquidity NUMERIC(20,2) NOT NULL,
      volume NUMERIC(20,2) NOT NULL,
      holders INT NOT NULL,
      price NUMERIC(20,8) NOT NULL,
      captured_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const traderCount = await pool.query('SELECT COUNT(*) AS count FROM traders');
  if (Number(traderCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO traders (name, status, win_rate, confidence, last_signal_at)
      VALUES
        ('Trader Alpha', 'active', 68.50, 86.20, NOW() - INTERVAL '5 minutes'),
        ('Trader Beta', 'active', 72.10, 89.00, NOW() - INTERVAL '7 minutes'),
        ('Trader Gamma', 'watch', 61.80, 74.00, NOW() - INTERVAL '12 minutes')
    `);
  }

  const signalCount = await pool.query('SELECT COUNT(*) AS count FROM signals');
  if (Number(signalCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO signals (trader_id, token, pair, side, price, market_cap, liquidity, volume, holders, confidence, event_time)
      VALUES
        (1, 'FOMO', 'FOMO/USDT', 'buy', 0.0026, 12400000, 180000, 540000, 1280, 87.4, NOW() - INTERVAL '8 minutes'),
        (2, 'REX', 'REX/USDT', 'buy', 0.0084, 9200000, 155000, 390000, 960, 82.7, NOW() - INTERVAL '12 minutes'),
        (3, 'NOVA', 'NOVA/USDT', 'buy', 0.0151, 17100000, 220000, 610000, 1540, 79.8, NOW() - INTERVAL '17 minutes'),
        (1, 'FOMO', 'FOMO/USDT', 'sell', 0.0029, 13800000, 260000, 720000, 1295, 84.1, NOW() - INTERVAL '2 minutes')
    `);
  }

  const tradeCount = await pool.query('SELECT COUNT(*) AS count FROM trades');
  if (Number(tradeCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO trades (trader_id, token, side, buy_price, sell_price, pnl, status, opened_at, closed_at)
      VALUES
        (1, 'FOMO', 'buy', 0.0026, 0.0029, 0.0003, 'closed', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '2 minutes'),
        (2, 'REX', 'buy', 0.0084, 0.0091, 0.0007, 'closed', NOW() - INTERVAL '33 minutes', NOW() - INTERVAL '9 minutes'),
        (1, 'NOVA', 'buy', 0.0151, 0.0160, 0.0009, 'open', NOW() - INTERVAL '5 minutes', NULL)
    `);
  }

  const metricCount = await pool.query('SELECT COUNT(*) AS count FROM token_metrics');
  if (Number(metricCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO token_metrics (token, market_cap, liquidity, volume, holders, price)
      VALUES
        ('FOMO', 12400000, 180000, 540000, 1280, 0.0026),
        ('REX', 9200000, 155000, 390000, 960, 0.0084),
        ('NOVA', 17100000, 220000, 610000, 1540, 0.0151),
        ('ATOM', 30100000, 410000, 880000, 2110, 0.0321)
    `);
  }
}

app.get('/api/health', async (_, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, databaseTime: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/traders', async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM traders
      ORDER BY last_signal_at DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/signals', async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM signals
      ORDER BY event_time DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trades', async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM trades
      ORDER BY opened_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tokens', async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM token_metrics
      ORDER BY captured_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard', async (_, res) => {
  try {
    const tradersResult = await pool.query('SELECT * FROM traders ORDER BY win_rate DESC');
    const signalsResult = await pool.query('SELECT * FROM signals ORDER BY event_time DESC LIMIT 8');
    const tradesResult = await pool.query('SELECT * FROM trades ORDER BY opened_at DESC LIMIT 6');
    const tokenMetricsResult = await pool.query('SELECT * FROM token_metrics ORDER BY captured_at DESC');
    const totalPnlResult = await pool.query('SELECT COALESCE(SUM(CASE WHEN pnl IS NOT NULL THEN pnl ELSE 0 END), 0) AS total_pnl FROM trades');
    const openTradesResult = await pool.query('SELECT COUNT(*) AS open_trades FROM trades WHERE status = $1', ['open']);

    const totalPnl = Number(totalPnlResult.rows[0].total_pnl || 0);
    const activeTraders = tradersResult.rows.filter((trader) => trader.status === 'active').length;

    const summary = {
      totalTraders: tradersResult.rows.length,
      activeTraders,
      totalSignals: signalsResult.rows.length,
      openTrades: Number(openTradesResult.rows[0].open_trades || 0),
      totalPnl,
      avgWinRate: tradersResult.rows.length
        ? (tradersResult.rows.reduce((sum, trader) => sum + Number(trader.win_rate), 0) / tradersResult.rows.length).toFixed(2)
        : 0,
    };

    res.json({
      summary,
      traders: tradersResult.rows,
      liveSignals: signalsResult.rows,
      recentTrades: tradesResult.rows,
      tokenMetrics: tokenMetricsResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/simulate', async (req, res) => {
  try {
    const latestSignal = await pool.query(`
      SELECT * FROM signals
      ORDER BY event_time DESC
      LIMIT 1
    `);

    const signal = latestSignal.rows[0];
    if (!signal) {
      return res.status(404).json({ error: 'No signal found to simulate.' });
    }

    const averageEntryPrice = Number(signal.price);
    const simulatedExitMultiplier = signal.side === 'buy' ? 1.122 : 0.934;
    const simulatedExitPrice = averageEntryPrice * simulatedExitMultiplier;
    const estimatedPnl = ((simulatedExitPrice - averageEntryPrice) / averageEntryPrice) * 100;

    const result = {
      strategy: 'signal_monitor_validation',
      token: signal.token,
      traderId: signal.trader_id,
      side: signal.side,
      entryPrice: averageEntryPrice,
      estimatedExitPrice: simulatedExitPrice,
      estimatedPnL: Number(estimatedPnl.toFixed(4)),
      status: estimatedPnl > 0 ? 'profitable' : 'review',
      source: 'simulation',
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((_, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(port, () => {
      console.log(`Signal Bot API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();
