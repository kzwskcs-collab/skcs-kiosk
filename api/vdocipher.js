export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const VDOCIPHER_API_SECRET = process.env.VDOCIPHER_API_SECRET;
  if (!VDOCIPHER_API_SECRET) return res.status(500).json({ error: 'VDOCIPHER_API_SECRET not set' });
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: 'videoId is required' });
  try {
    const response = await fetch(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, {
      method: 'POST',
      headers: { 'Authorization': `Apisecret ${VDOCIPHER_API_SECRET}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ ttl: 300 })
    });
    if (!response.ok) { const err = await response.text(); return res.status(response.status).json({ error: err }); }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
