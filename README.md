# 星浜祭 EventOps

大学祭運営を題材に、名簿・参加団体・企画・シフト・投票を一元管理するポートフォリオアプリです。

[デモを見る](https://event-ops-suzukishoya.vercel.app)

## 主な機能

* 名簿・参加団体・企画の管理
* 個人別／担当業務別シフト
* 日時変更対応のサイトプレビュー
* リアルタイム投票集計

> 運営画面の変更は再読み込みで初期化されます。Supabaseは投票機能にのみ使用しています。

## 技術

Next.js 16 / React 19 / TypeScript / Tailwind CSS / Supabase / Vitest

## ローカル実行

Node.js 22を使用します。

```bash
nvm use
npm ci
npm run dev
```

### 投票機能の設定

1. [`supabase/migrations`](supabase/migrations)内のSQLをファイル名順に実行
2. `.env.example`を`.env.local`へコピーし、Supabaseの接続情報を設定
3. `visitor_votes`のRealtimeを有効化

## 動作確認

```bash
npm test
npm run lint
npm run build
```

## 設計資料

* [システム構成](docs/system-architecture.md)
* [投票データのER図](docs/er.md)
