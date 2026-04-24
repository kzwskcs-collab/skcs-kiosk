export default async function handler(req, res) {
  const hospital = req.query.hospital || '';
  const startUrl = hospital ? `/?hospital=${hospital}` : '/';

  const manifest = {
    name: '患者説明動画 SKCS',
    short_name: '患者説明動画',
    description: 'SK Clinical Support System - 患者説明動画KIOSK',
    start_url: startUrl,
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#0d3d6b',
    theme_color: '#1a5fa8',
    lang: 'ja',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  // Plan B (2026-04-22): 回転時リロード503エラー対策
  // Plan D (2026-04-24): orientation lock解除（any）で自由な回転を可能に
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json(manifest);
}
