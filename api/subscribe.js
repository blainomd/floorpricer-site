const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      count: "unknown",
      message: "Check Vercel function logs for email list — search for [floorpricer subscriber]",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const email = (body.email || "").trim().toLowerCase();
    const source = body.source || "floorpricer-site";

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }

    console.log(
      `[floorpricer subscriber] ${new Date().toISOString()} | email=${email} | source=${source}`
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[floorpricer subscribe] error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
