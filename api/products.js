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

function isAuthorized(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  const provided =
    req.headers["x-admin-password"] ||
    (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, "")) ||
    (req.body && req.body.adminPassword);
  return provided === adminPassword;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-password");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      const raw = await redisCommand("get", "products");
      const products = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ products: Array.isArray(products) ? products : [] });
    }

    if (req.method === "POST") {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const raw = await redisCommand("get", "products");
      const current = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(current) ? current : [];

      // إذا أرسلت مصفوفة كاملة أو منتجاً واحداً
      if (Array.isArray(body.products)) {
        await redisCommand("set", "products", JSON.stringify(body.products));
        return res.status(200).json({ ok: true, products: body.products });
      }

      const product = body.product || body;
      if (!product || !product.name) {
        return res.status(400).json({ error: "Product name is required" });
      }

      const item = {
        id: product.id || `prod_${Date.now()}`,
        name: product.name,
        price: Number(product.price) || 0,
        description: product.description || "",
        image: product.image || "",
        category: product.category || "",
        createdAt: product.createdAt || new Date().toISOString(),
      };

      const existingIndex = list.findIndex((p) => p.id === item.id);
      if (existingIndex >= 0) {
        list[existingIndex] = { ...list[existingIndex], ...item };
      } else {
        list.unshift(item);
      }

      await redisCommand("set", "products", JSON.stringify(list));
      return res.status(200).json({ ok: true, product: item, products: list });
    }

    if (req.method === "DELETE") {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const id = req.query?.id || (req.body && req.body.id);
      const raw = await redisCommand("get", "products");
      const list = raw ? JSON.parse(raw) : [];
      const filtered = id ? list.filter((p) => p.id !== id) : [];
      await redisCommand("set", "products", JSON.stringify(filtered));
      return res.status(200).json({ ok: true, products: filtered });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
