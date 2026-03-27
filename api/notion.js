// Vercel Serverless Function
// ブラウザ → このAPI → Notion API（CORSを回避）

export default async function handler(req, res) {
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.DATABASE_ID;

  if (!NOTION_TOKEN || !DATABASE_ID) {
    return res.status(500).json({ error: 'Environment variables not set' });
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            and: [
              { property: 'KIOSK表示', checkbox: { equals: true } },
              { property: 'KIOSK動画URL', url: { is_not_empty: true } },
            ],
          },
          sorts: [{ property: '順番', direction: 'ascending' }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    // フロントエンドに必要なフィールドだけ返す
    const videos = data.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        title: p['疾患/テーマ名']?.title?.[0]?.plain_text || '無題',
        category: p['カテゴリ']?.select?.name || 'その他',
        layer: p['レイヤー']?.select?.name || '',
        lang: p['言語']?.select?.name || '日本語',
        videoUrl: p['KIOSK動画URL']?.url || '',
        order: p['順番']?.number ?? 999,
      };
    });

    return res.status(200).json({ videos });
  } catch (err) {
    console.error('Notion API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
