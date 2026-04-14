// /api/quotes — free live quotes proxy for FloorPricer demo portfolio.
// Fetches from Stooq (no key required) server-side to avoid CORS.
// Usage: /api/quotes?symbols=TSLA,NVDA,AAPL,SPY

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const raw = (req.query.symbols || "TSLA,NVDA,AAPL,SPY").toString();
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 12);

  try {
    const quotes = await Promise.all(
      symbols.map(async (sym) => {
        const url = `https://stooq.com/q/l/?s=${encodeURIComponent(
          sym.toLowerCase()
        )}.us&f=sd2t2ohlcv&h&e=csv`;
        try {
          const r = await fetch(url, { headers: { "User-Agent": "floorpricer.com" } });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const text = await r.text();
          const lines = text.trim().split(/\r?\n/);
          if (lines.length < 2) throw new Error("no data");
          const cols = lines[1].split(",");
          // Symbol,Date,Time,Open,High,Low,Close,Volume
          const open = parseFloat(cols[3]);
          const high = parseFloat(cols[4]);
          const low = parseFloat(cols[5]);
          const close = parseFloat(cols[6]);
          if (!Number.isFinite(close)) throw new Error("bad close");
          const changePct = open ? ((close - open) / open) * 100 : 0;
          return {
            symbol: sym,
            price: close,
            open,
            high,
            low,
            changePct: Number(changePct.toFixed(2)),
            asOf: `${cols[1]} ${cols[2]}`,
          };
        } catch (e) {
          return { symbol: sym, error: e.message };
        }
      })
    );

    return res.status(200).json({ quotes, ts: Date.now() });
  } catch (err) {
    console.error("[floorpricer quotes] error:", err);
    return res.status(500).json({ error: "quote fetch failed" });
  }
};
