# EventOps

EventOps は、学園祭・イベント運営向けの統合管理アプリです。シフト、名簿、参加団体、企画、投票、権限、DTP、カンバン、キャンパスゲームを 1 つの Next.js アプリとして扱います。

## 主な機能

- シフト管理: シフトシート作成、横型/縦型タイムライン、ドラッグ作成、検索絞り込み
- 名簿管理: メンバー追加、CSV 出力、詳細モーダル編集、所属/役職編集
- 権限管理: 役職別・メンバー別の画面権限、所属/役職マスタ編集
- 団体/企画管理: テーブル編集、検索、ソート、状態管理
- DTP Studio: 参加団体・企画データからパンフレットを作成、レイアウト編集、HTML 出力、印刷/PDF
- カンバン: Trello 風の企画ステータス管理
- キャンパスゲーム: 3D キャンパス移動、開催時間タイマー、空腹ゲージ、模擬店での食事
- カメラ: スマホ向け撮影、内外カメラ切替、フィルタ

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

初期管理者:

- メール: `ops.admin@example.invalid`
- パスワード: `EventOps-2026!Local`

## 開発コマンド

```bash
npm run dev       # 開発サーバー
npm run build     # 本番ビルド
npm run lint      # ESLint
npm test          # Vitest
npm run test:watch
```

## データ保存

現状は `app/api/app-data/route.ts` が `data/app-data.json` を読み書きするローカル永続化です。

保存対象:

- members
- organizations
- projects
- shiftDataByAccount
- permissionSettings

本番運用では DB と認証サービスへ移行する前提です。

## 操作メモ

### シフト

1. 管理者でログインします。
2. シフト画面で「シート新規作成」を押します。
3. シート名、期間、招待メンバーを設定します。
4. タイムライン上をドラッグしてシフトを作成します。
5. 現在のシート名をクリックすると名前を編集できます。
6. シート名右横の検索アイコンからシートを検索・切替できます。

### 名簿

- メンバー名の右横の詳細ボタンからモーダルを開き、氏名・メール・所属・役職を編集できます。
- 顔画像欄は丸形アバターとして表示します。

### 権限

- 役職ごとに表示可能ページを設定できます。
- メンバー個別の権限は役職設定より優先されます。
- 所属と役職の候補もこの画面で編集できます。

### DTP

- 左の編集パネルでタイトル、サブタイトル、テーマ、段組、余白、文字サイズを調整します。
- 企画ごとの掲載文を編集できます。
- 「印刷/PDF」でブラウザ印刷、「HTML出力」で単体 HTML を保存できます。

## ドキュメント

- [ER図](docs/er.md)
- [システム構成図](docs/system-architecture.md)

## CI

GitHub Actions で `lint`、`test`、`build` を実行します。

設定: `.github/workflows/ci.yml`

## 推奨アーキテクチャ移行方針

- 認証: Auth.js または Supabase Auth
- DB: Supabase Postgres
- ORM: Drizzle ORM または Prisma

詳細な選定理由は実装者メモや設計レビューで管理してください。
