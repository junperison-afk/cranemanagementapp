# Xサーバー向けデプロイ手順

## 重要な前提条件

**Xサーバーは通常、Node.jsが使えない共有ホスティングサービスです。**

このアプリケーションはNext.jsを使用しており、以下の機能が必要です：
- **Node.js実行環境**（必須）
- サーバーサイドレンダリング（SSR）
- APIルート（`/api/*`）
- データベース接続（Supabase PostgreSQL）

## デプロイ方法の選択

### ❌ 静的エクスポートは使用不可

静的エクスポート（`output: 'export'`）では、APIルートやサーバーサイド機能が動作しないため、このアプリケーションは動作しません。

### ✅ 推奨方法: Vercelを使用（最も簡単）

XサーバーでNode.jsが使えない場合、**Vercel**を使用することを強く推奨します。

#### 手順

1. **Vercelアカウントを作成**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン（推奨）

2. **プロジェクトをインポート**
   - 「Add New Project」をクリック
   - GitHubリポジトリを選択
   - プロジェクト名を設定（例: `crane-management`）

3. **環境変数を設定**
   - 「Environment Variables」で以下を設定：
     ```
     DATABASE_URL=postgresql://postgres:[PASSWORD]@db.nypyvzqfmessxboiwfka.supabase.co:5432/postgres
     NEXTAUTH_URL=https://manage.crane-mitsumori.com
     NEXTAUTH_SECRET=[ランダムな32文字以上の文字列]
     ```

4. **デプロイ**
   - 「Deploy」をクリック
   - 自動でビルド・デプロイが開始
   - 完了後、`https://[プロジェクト名].vercel.app` でアクセス可能

5. **カスタムドメインの設定**
   - Vercelのダッシュボードで「Settings」→「Domains」
   - `manage.crane-mitsumori.com` を追加
   - XサーバーのDNS設定で、`manage.crane-mitsumori.com` のAレコードをVercelのIPアドレスに設定
   - または、CNAMEレコードで `cname.vercel-dns.com` を設定

### 代替方法: VPSサーバーを使用

Vercelが使えない場合、VPSサーバーを借りてNode.js環境を構築します。

#### 推奨VPSサービス
- ConoHa VPS
- さくらのVPS
- AWS EC2
- Google Cloud Compute Engine

#### VPSでのデプロイ手順

1. **VPSサーバーを準備**
   - Node.js 18以上をインストール
   - PM2をインストール（プロセス管理用）

2. **アプリケーションをデプロイ**
```bash
# サーバーにSSH接続
ssh user@your-vps-server

# アプリケーションをクローンまたはアップロード
cd /var/www
git clone [リポジトリURL] crane-management
cd crane-management

# 依存関係をインストール
npm install --production

# 環境変数を設定
nano .env.local
# DATABASE_URL=...
# NEXTAUTH_URL=https://manage.crane-mitsumori.com
# NEXTAUTH_SECRET=...

# Prismaクライアントを生成
npx prisma generate

# ビルド
npm run build

# PM2で起動
pm2 start npm --name "crane-management" -- start
pm2 save
pm2 startup
```

3. **Nginxでリバースプロキシを設定**
```nginx
server {
    listen 80;
    server_name manage.crane-mitsumori.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **SSL証明書を設定**
```bash
sudo certbot --nginx -d manage.crane-mitsumori.com
```

### XサーバーでNode.jsが使える場合（要確認）

Xサーバーの一部のプランではNode.jsが使える場合があります。サーバーパネルで確認してください。

#### 確認方法
1. Xサーバーのサーバーパネルにログイン
2. 「Node.js設定」または「アプリケーション設定」を確認
3. Node.jsが使える場合は、バージョンを確認

#### デプロイ手順（Node.jsが使える場合）

1. **ローカルでビルド**
```bash
npm run build
```

2. **必要なファイルをアップロード**
   - `.next/` フォルダ
   - `public/` フォルダ
   - `package.json`
   - `package-lock.json`
   - `prisma/` フォルダ
   - `.env.local`（環境変数）

3. **サーバーで実行**
```bash
# SSH接続またはサーバーパネルのターミナル機能を使用
cd /crane-mitsumori.com/public_html/manage
npm install --production
npx prisma generate
npm start
```

## 環境変数の設定

本番環境で以下の環境変数を設定する必要があります：

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.nypyvzqfmessxboiwfka.supabase.co:5432/postgres
NEXTAUTH_URL=https://manage.crane-mitsumori.com
NEXTAUTH_SECRET=[ランダムな32文字以上の文字列]
```

`NEXTAUTH_SECRET`は以下のコマンドで生成できます：
```bash
openssl rand -base64 32
```

## デプロイ後の確認事項

- [ ] アプリケーションが正常に起動している
- [ ] ログイン機能が動作する
- [ ] データベース接続が正常
- [ ] 各画面が正常に表示される
- [ ] APIルートが正常に動作する
- [ ] 環境変数が正しく設定されている
- [ ] SSL証明書が設定されている（HTTPS）

## トラブルシューティング

### Node.jsが使えない場合
- Vercelを使用する（推奨）
- VPSサーバーを借りる
- 別のNext.js対応ホスティングサービスを使用

### データベース接続エラー
- 環境変数`DATABASE_URL`が正しく設定されているか確認
- Supabaseの接続設定を確認
- ファイアウォール設定を確認

### 認証エラー
- `NEXTAUTH_URL`が正しく設定されているか確認
- `NEXTAUTH_SECRET`が設定されているか確認

