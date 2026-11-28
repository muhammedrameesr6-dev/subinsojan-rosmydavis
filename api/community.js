const STORAGE_KEY = 'wedding_subin_rosmy_community';
const MAX_ITEMS = 500;
const DEFAULT_GOOGLE_SHEET_URL = '';

function getGoogleSheetUrl() {
  const url = String(process.env.GOOGLE_SHEET_URL || DEFAULT_GOOGLE_SHEET_URL || '').trim();
  return url || null;
}

async function fetchGoogleSheetGet(sheetUrl) {
  const res = await fetch(sheetUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Google Sheet GET failed: ${res.status}`);
  }
  const data = await res.json();
  return {
    wishes: Array.isArray(data.wishes) ? data.wishes.slice(0, MAX_ITEMS) : [],
    rsvps: Array.isArray(data.rsvps) ? data.rsvps.slice(0, MAX_ITEMS) : [],
  };
}

async function postGoogleSheetEntry(sheetUrl, payload) {
  const res = await fetch(sheetUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Google Sheet POST failed: ${res.status}`);
  }
  const data = await res.json();
  if (data && data.ok === false) {
    throw new Error(data.error || 'Google Sheet rejected submission');
  }
  return {
    wishes: Array.isArray(data.wishes) ? data.wishes.slice(0, MAX_ITEMS) : [],
    rsvps: Array.isArray(data.rsvps) ? data.rsvps.slice(0, MAX_ITEMS) : [],
  };
}

function getRedisConfig() {
  let url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  let token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    const keys = Object.keys(process.env);
    const urlKey = keys.find((k) => k.endsWith('_REST_API_URL') || k.endsWith('_REDIS_REST_URL'));
    if (urlKey) {
      const prefix = urlKey.replace(/(_REST_API_URL|_REDIS_REST_URL)$/, '');
      url = process.env[urlKey];
      token =
        process.env[`${prefix}_REST_API_TOKEN`] ||
        process.env[`${prefix}_REDIS_REST_TOKEN`] ||
        process.env.KV_REST_API_TOKEN ||
        process.env.UPSTASH_REDIS_REST_TOKEN;
    }
  }

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
  const sheetUrl = getGoogleSheetUrl();
  const cfg = getRedisConfig();
  const isConfigured = Boolean(sheetUrl || cfg);

  if (req.method === 'GET') {
    if (!isConfigured) {
      return res.status(200).json({ configured: false, wishes: [], rsvps: [] });
    }
    try {
      const data = sheetUrl ? await fetchGoogleSheetGet(sheetUrl) : await readCommunityData(cfg);
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

    if (!isConfigured) {
      return res.status(200).json({ ok: true, configured: false });
    }

    const createdAt = cleanText(raw.createdAt, 64) || new Date().toISOString();
    let normalizedEntry;
    if (kind === 'wish') {
      const message = cleanText(raw.message, 5000);
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      normalizedEntry = { name, message, createdAt };
    } else if (kind === 'rsvp') {
      const attending = Boolean(raw.attending);
      const guests = attending ? Math.max(1, Math.min(20, parseInt(raw.guests, 10) || 1)) : 0;
      const message = cleanText(raw.message, 1000);
      normalizedEntry = { name, attending, guests, message, createdAt };
    } else {
      return res.status(400).json({ error: 'Invalid kind' });
    }

    try {
      let data;
      if (sheetUrl) {
        data = await postGoogleSheetEntry(sheetUrl, { kind, entry: normalizedEntry });
      } else {
        data = await readCommunityData(cfg);
        if (kind === 'wish') {
          const exists = data.wishes.some((w) => w.name === normalizedEntry.name && w.createdAt === normalizedEntry.createdAt);
          if (!exists) data.wishes.unshift(normalizedEntry);
        } else {
          const exists = data.rsvps.some((r) => r.name === normalizedEntry.name && r.createdAt === normalizedEntry.createdAt);
          if (!exists) data.rsvps.unshift(normalizedEntry);
        }
        await writeCommunityData(cfg, data);
      }
      return res.status(200).json({ ok: true, configured: true, wishes: data.wishes, rsvps: data.rsvps });
    } catch (err) {
      return res.status(500).json({ ok: false, configured: true, error: 'Failed to save entry' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
