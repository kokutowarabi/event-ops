# 星浜祭 EventOps

架空の大学祭を題材にした、運営管理のポートフォリオアプリです。

[デモを見る](https://event-ops-suzukishoya.vercel.app)

## 主な機能

- 参加団体20組・企画40件
- 名簿と個人別／担当業務別シフト
- 日時変更対応のサイトプレビュー
- 企画投票とRealtime集計

ログイン、CMS、運営データの保存はありません。運営画面の変更は再読み込みで消えます。Supabaseは投票だけに使用します。

## Supabase

無料枠以外は使用しないでください。

1. [`supabase/migrations`](supabase/migrations)内のSQLをファイル名順に実行
2. `.env.example`を`.env.local`へコピーしてURLとPublishable keyを設定
3. Supabase Dashboardで`visitor_votes`のRealtimeを確認

匿名ユーザーは投票データを直接更新できず、企画IDと本祭日を検証する`cast_visitor_vote`だけを実行できます。同一端末・同一企画・同一投票日は1票です。

## ローカル実行

```bash
nvm use
npm ci
npm run dev
```

確認:

```bash
npm test
npm run lint
npm run build
```

## 設計資料

- [システム構成](docs/system-architecture.md)
- [投票データのER図](docs/er.md)

Next.js 16.2 / React 19.2 / TypeScript 5 / Supabase（投票のみ）
