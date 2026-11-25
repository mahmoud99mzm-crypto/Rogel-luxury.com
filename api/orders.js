async function redisCommand(command, ...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Upstash Redis environment variables");
  }

  const response = await fetch(`${url}/${command}/${args.map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upstash error: ${text}`);
  }

  const data = await response.json();
  return data.result;
}

function isAdmin(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  const provided =
    req.headers["x-admin-password"] ||
    (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, "")) ||
    req.query?.adminPassword;
  return provided === adminPassword;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-password");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const raw = await redisCommand("get", "orders");
      const orders = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ orders: Array.isArray(orders) ? orders : [] });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const orderData = body.order || body;

      if (!orderData || (!orderData.customerName && !orderData.phone && !orderData.items)) {
        return res.status(400).json({ error: "Invalid order data" });
      }

      const raw = await redisCommand("get", "orders");
      const current = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(current) ? current : [];

      const newOrder = {
        id: orderData.id || `ord_${Date.now()}`,
        ...orderData,
        status: orderData.status || "جديد",
        createdAt: orderData.createdAt || new Date().toISOString(),
      };

      list.unshift(newOrder);
      await redisCommand("set", "orders", JSON.stringify(list));

      return res.status(200).json({ ok: true, order: newOrder });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
