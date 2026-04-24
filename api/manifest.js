export default async function handler(req, res) {
  const hospital = req.query.hospital || '';
  const startUrl = hospital ? `/?hospital=${hospital}` : '/';

  const manifest = {
    name: '患者説明動画 SKCS',
    short_name: '患者説明動画',
    description: 'SK Clinical Support System - 患者説明動画KIOSK',
    start_url: startUrl,
    display: 'fullscreen',
    orientation: 'landscape',
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
  // Plan D' (2026-04-25): orientation:any → landscape に戻す（動画+Home でKIOSK脚出する事故への対応）
  // visibilitychange によるPIN再ロックは index.html で維持（Plan D の本丸機能は残す）
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json(manifest);
}
