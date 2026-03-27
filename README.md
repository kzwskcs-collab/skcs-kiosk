# SKCS KIOSK PWA - Vercelデプロイ手順

## ファイル構成
```
kiosk-pwa/
├── index.html       ← KIOSKアプリ本体
├── sw.js            ← Service Worker（オフラインキャッシュ）
├── manifest.json    ← PWA設定
└── api/
    └── notion.js    ← CORSプロキシ（Vercel APIルート）
```

---

## ステップ1：GitHubリポジトリ作成

1. https://github.com/new にアクセス
2. Repository name: `skcs-kiosk` （例）
3. Private を選択
4. 「Create repository」

---

## ステップ2：ファイルをGitHubにpush

ターミナルで：
```bash
cd kiosk-pwa
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなたのID/skcs-kiosk.git
git push -u origin main
```

---

## ステップ3：Vercelアカウント作成＆デプロイ

1. https://vercel.com にアクセス
2. 「Sign Up」→「Continue with GitHub」
3. 「Add New Project」→ `skcs-kiosk` を選択
4. 「Deploy」ボタンを押す
5. 数十秒でデプロイ完了 → URLが発行される（例：https://skcs-kiosk.vercel.app）

---

## ステップ4：環境変数の設定（最重要）

Vercelの管理画面で：
1. プロジェクト → 「Settings」→「Environment Variables」
2. 以下の2つを追加：

| Key | Value |
|---|---|
| `NOTION_TOKEN` | secret_xxxxxxxxxxxx（取得済みのToken） |
| `DATABASE_ID` | fae377cd75ab4926b95bf68bf7aeeda7 |

3. 「Save」後、「Deployments」→「Redeploy」で再デプロイ

---

## ステップ5：NotionのIntegration接続確認

1. Notionの「IC動画 制作管理」DBを開く
2. 右上「…」→「接続先」→ 作成したIntegrationが接続されているか確認

---

## ステップ6：Bunny.netで動画をホスティング

1. https://bunny.net でアカウント作成
2. 「Storage」→「Add Storage Zone」
   - Name: skcs-videos（任意）
   - Region: Singapore（日本に最も近い）
3. 「CDN」→「Pull Zone」を追加して紐付け
4. MP4ファイルをアップロード
5. CDN URLをコピー（例：https://skcs.b-cdn.net/動画名.mp4）

---

## ステップ7：NotionDBに動画を登録

各動画エントリに：
- **KIOSK動画URL**：Bunny.netのMP4直リンク
- **KIOSK表示**：✅ チェックON
- **順番**：表示順（1, 2, 3…）

---

## ステップ8：タブレット設定

1. ChromeでデプロイされたVercel URLを開く
2. 右上メニュー「ホーム画面に追加」→「インストール」
3. 「更新」ボタンを押して初回キャッシュを実行
4. Scalefusionでキオスクモードに設定

---

## 日常運用：Claudeで動画追加

```
「心室頻拍の説明動画をKIOSKに追加して
 URL: https://skcs.b-cdn.net/VT.mp4
 カテゴリ：不整脈・アブレーション
 Layer1」
```

→ ClaudeがNotionを更新 → タブレットで「更新」ボタン → 完了

---

## GitHubへのpushで自動デプロイ

コードを修正してGitHubにpushするだけでVercelが自動デプロイします。
タブレット側は次回起動時に自動で最新版を取得します。
