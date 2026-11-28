const STORAGE_KEY = 'wedding_subin_rosmy_community';
const MAX_ITEMS = 500;

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function readCommunityData(cfg) {
  const res = await fetch(`${cfg.url}/get/${encodeURIComponent(STORAGE_KEY)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  if (!res.ok) {
    throw new Error(`Redis GET failed: ${res.status}`);
  }
  const payload = await res.json();
  if (!payload || !payload.result) {
    return { wishes: [], rsvps: [] };
  }
  try {
    const parsed = typeof payload.result === 'string' ? JSON.parse(payload.result) : payload.result;
    return {
      wishes: Array.isArray(parsed.wishes) ? parsed.wishes : [],
      rsvps: Array.isArray(parsed.rsvps) ? parsed.rsvps : [],
    };
  } catch (_) {
    return { wishes: [], rsvps: [] };
  }
}

async function writeCommunityData(cfg, data) {
  const serialized = JSON.stringify({
    wishes: data.wishes.slice(0, MAX_ITEMS),
    rsvps: data.rsvps.slice(0, MAX_ITEMS),
  });
  const res = await fetch(`${cfg.url}/set/${encodeURIComponent(STORAGE_KEY)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: serialized,
  });
  if (!res.ok) {
    throw new Error(`Redis SET failed: ${res.status}`);
  }
}

function cleanText(value, maxLen) {
  return String(value || '').trim().slice(0, maxLen);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const cfg = getRedisConfig();

  if (req.method === 'GET') {
    if (!cfg) {
      return res.status(200).json({ configured: false, wishes: [], rsvps: [] });
    }
    try {
      const data = await readCommunityData(cfg);
      return res.status(200).json({ configured: true, wishes: data.wishes, rsvps: data.rsvps });
    } catch (err) {
      return res.status(500).json({ configured: true, error: 'Failed to load community data' });
    }
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Missing body' });
    }

    const kind = body.kind;
    const raw = body.entry || {};
    const name = cleanText(raw.name, 200);
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!cfg) {
      return res.status(200).json({ ok: true, configured: false });
    }

    try {
      const data = await readCommunityData(cfg);
      const createdAt = new Date().toISOString();

      if (kind === 'wish') {
        const message = cleanText(raw.message, 5000);
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }
        data.wishes.unshift({ name, message, createdAt });
      } else if (kind === 'rsvp') {
        const attending = Boolean(raw.attending);
        const guests = attending ? Math.max(1, Math.min(20, parseInt(raw.guests, 10) || 1)) : 0;
        const message = cleanText(raw.message, 1000);
        data.rsvps.unshift({ name, attending, guests, message, createdAt });
      } else {
        return res.status(400).json({ error: 'Invalid kind' });
      }

      await writeCommunityData(cfg, data);
      return res.status(200).json({ ok: true, configured: true, wishes: data.wishes, rsvps: data.rsvps });
    } catch (err) {
      return res.status(500).json({ ok: false, configured: true, error: 'Failed to save entry' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
