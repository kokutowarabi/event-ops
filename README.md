# 星浜祭 EventOps

架空の「星浜大学・星浜祭」を題材にした、大学祭実行委員向けの運営管理アプリです。

MVPでは次の機能に絞っています。

- 参加団体管理（初期データ20組）
- 企画管理（1組につき2企画、合計40企画）
- 実行委員名簿
- 個人別・担当業務別のシフト管理
- Supabaseへ集まった端末単位投票のリアルタイム集計

カンバンとサイトCMSはMVPの対象外です。公開サイトは別リポジトリで管理します。

## データ共有

運営データはSupabase Postgresの`event_ops_state`へ保存します。Supabase Authでログインしたユーザーは全員が同じデータを編集でき、`event_ops_state`と`visitor_votes`の変更はSupabase Realtimeで各画面へ反映されます。

ブラウザの`localStorage`を運営データの保存先には使用しません。Supabaseが未設定の場合は管理画面を開かず、接続設定画面を表示します。

## 無料枠でのSupabase設定

このリポジトリの運用では、課金が発生するプランやアドオンを使用しないでください。

1. Supabaseで無料枠のプロジェクトを用意します。
2. Supabase DashboardのSQL Editorで[`supabase/migrations/20260729000000_event_ops.sql`](supabase/migrations/20260729000000_event_ops.sql)を実行します。
3. AuthenticationのUsers画面で、運営メンバーのメールアドレスとパスワードを登録します。
4. `.env.example`を参考に、ローカルの`.env.local`またはVercelのEnvironment Variablesへ次を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Publishable keyはブラウザへ公開される前提のキーです。`service_role`キーは絶対にブラウザやVercelの`NEXT_PUBLIC_`環境変数へ設定しないでください。データ更新の権限はSQLマイグレーション内のRow Level Securityで制御します。

## 端末単位の投票

`visitor_votes.device_id`が主キーのため、1端末につき有効な投票は1票です。同じ端末が別企画へ投票すると、既存の1票が新しい企画へ変更されます。

別リポジトリの公開サイトからは、端末UUIDを`localStorage`へ保持し、次のRPCを呼び出します。

```ts
const storageKey = "hoshihama-voting-device-id"
const deviceId = localStorage.getItem(storageKey) ?? crypto.randomUUID()
localStorage.setItem(storageKey, deviceId)

await supabase.rpc("cast_visitor_vote", {
  p_device_id: deviceId,
  p_project_id: projectId,
})
```

管理アプリの投票結果ページは、固定値や偽の投票数を加えず、`visitor_votes`に存在する行だけを集計します。

## シフト

初期状態では、20名全員に準備・本祭・片付けを合わせた10日間のシフトを割り当てています。各人・各日に午前担当、45分の休憩、午後担当があります。

シフト画面には次の2つの表示があります。

- 個人別: 各メンバーの時間軸からシフトを作成・移動・編集
- 担当業務別: 受付、会場誘導、警備、休憩などの業務ごとに、時間帯別人数、最大重複人数、担当者、延べ時間を確認・編集

## ローカル実行

Node.js 22とnpm 10.8.1を使用します。

```bash
nvm use
npm ci
npm run dev
```

ブラウザで`http://localhost:3000`を開いてください。

```bash
npm run lint
npm test
npm run build
```

## 技術構成

- Next.js 16.2 / React 19.2 / TypeScript 5
- Tailwind CSS 4 / Base UI
- Supabase Auth / Postgres / Row Level Security / Realtime
- Vitest / ESLint
