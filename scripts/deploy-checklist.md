# 本番環境デプロイチェックリスト

## `/crane-mitsumori.com/public_html/manage` へのデプロイ手順

### 前提条件の確認

- [ ] サーバーでNode.jsが使用可能か確認
- [ ] データベース（Supabase PostgreSQL）への接続が可能か確認
- [ ] 環境変数を設定できるか確認

### デプロイ手順

#### 1. ローカルでビルド

```bash
# 依存関係のインストール（初回のみ）
npm install

# 本番用ビルド
npm run build
```

#### 2. アップロードするファイル・フォルダ

以下のファイル・フォルダを `/crane-mitsumori.com/public_html/manage` にアップロード：

**必須ファイル:**
- `.next/` フォルダ（ビルド成果物）
- `public/` フォルダ
- `package.json`
- `package-lock.json`
- `next.config.js`
- `tsconfig.json`
- `prisma/` フォルダ（スキーマファイル）

**オプション:**
- `node_modules/` フォルダ（アップロードしない場合はサーバーで `npm install --production` を実行）

#### 3. サーバーでの作業

```bash
# サーバーにSSH接続後、manageフォルダに移動
cd /crane-mitsumori.com/public_html/manage

# 依存関係のインストール（node_modulesをアップロードしていない場合）
npm install --production

# Prismaクライアントの生成
npx prisma generate

# 環境変数の設定（.env.localファイルを作成）
# DATABASE_URL=postgresql://...
# NEXTAUTH_URL=https://manage.crane-mitsumori.com
# NEXTAUTH_SECRET=...

# アプリケーションの起動
npm start
```

#### 4. プロセス管理（PM2を使用）

```bash
# PM2のインストール
npm install -g pm2

# アプリケーションをPM2で起動
pm2 start npm --name "crane-management" -- start

# 自動起動の設定
pm2 save
pm2 startup
```

#### 5. リバースプロキシの設定（Nginxなど）

`manage.crane-mitsumori.com` が `http://localhost:3000` にプロキシするように設定

### 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.nypyvzqfmessxboiwfka.supabase.co:5432/postgres
NEXTAUTH_URL=https://manage.crane-mitsumori.com
NEXTAUTH_SECRET=[ランダムな32文字以上の文字列]
```

### 注意事項

1. **Node.jsが使えない場合**: このアプリケーションは動作しません。VPSやクラウドサーバーが必要です。
2. **セキュリティ**: `.env.local` は絶対に公開しない
3. **ポート番号**: デフォルトでは3000番ポートを使用。必要に応じて変更

