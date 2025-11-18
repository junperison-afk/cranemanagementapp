# Vercel本番環境デプロイ手順

## 概要

このドキュメントでは、クレーン管理アプリケーションをVercelの本番環境にデプロイする具体的な手順を説明します。

## 前提条件

- Vercelアカウント（https://vercel.com で作成可能）
- GitHubアカウント（またはGitLab、Bitbucketなど）
- PostgreSQLデータベース（Supabaseなど）
- 本番環境用の環境変数情報

## ステップ1: 事前準備

### 1-1. リポジトリの準備

プロジェクトをGitリポジトリにプッシュしてください：

```bash
# Gitリポジトリの初期化（まだの場合）
git init

# リモートリポジトリを追加（GitHubの場合）
git remote add origin https://github.com/[ユーザー名]/[リポジトリ名].git

# コミット
git add .
git commit -m "Initial commit"

# プッシュ
git push -u origin main
```

### 1-2. 環境変数の確認

以下の環境変数が必要です：

| 環境変数名 | 説明 | 例 |
|----------|------|-----|
| `DATABASE_URL` | PostgreSQLデータベース接続URL | `postgresql://user:password@host:5432/dbname` |
| `NEXTAUTH_URL` | 本番環境のURL | `https://your-app.vercel.app` または `https://manage.crane-mitsumori.com` |
| `NEXTAUTH_SECRET` | NextAuth.jsの暗号化キー | ランダムな文字列（32文字以上推奨） |

**NEXTAUTH_SECRETの生成方法：**

```bash
# ターミナルで実行
openssl rand -base64 32
```

または、オンラインツール（https://generate-secret.vercel.app/32）を使用して生成できます。

## ステップ2: Vercelプロジェクトの作成

### 2-1. Vercelにログイン

1. https://vercel.com にアクセス
2. 「Sign Up」または「Log In」をクリック
3. GitHubアカウントでログイン（推奨）

### 2-2. プロジェクトのインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. 「Import Git Repository」を選択
3. GitHubリポジトリを選択または検索
4. リポジトリが見つからない場合は「Adjust GitHub App Permissions」で権限を設定

### 2-3. プロジェクト設定

**Framework Preset:**
- 自動検出されるはずですが、「Next.js」が選択されていることを確認

**Root Directory:**
- プロジェクトのルートディレクトリを指定（通常は空欄のまま）

**Build and Output Settings:**
- Build Command: `npm run build`（デフォルト）
- Output Directory: `.next`（デフォルト）
- Install Command: `npm install`（デフォルト）

## ステップ3: 環境変数の設定

### 3-1. 環境変数の追加

1. プロジェクト設定画面で「Environment Variables」を開く
2. 以下の環境変数を追加：

```
DATABASE_URL=postgresql://[ユーザー名]:[パスワード]@[ホスト]:5432/[データベース名]
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[生成したシークレットキー]
```

3. **Environment**を選択：
   - **Production**（本番環境）
   - **Preview**（プレビュー環境、オプション）
   - **Development**（開発環境、オプション）

4. 「Save」をクリック

### 3-2. 環境変数の確認

設定した環境変数が表示されていることを確認してください。

**注意:** `DATABASE_URL`は本番環境用のデータベース接続情報を使用してください。

## ステップ4: ビルド設定の調整（必要に応じて）

### 4-1. Vercel設定ファイルの作成

プロジェクトルートに `vercel.json` を作成（オプション）：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["nrt1"]
}
```

**regions:** 日本の場合は `nrt1`（東京）を指定するとレイテンシが改善されます。

### 4-2. Next.js設定の確認

`next.config.js` が正しく設定されていることを確認：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

## ステップ5: デプロイの実行

### 5-1. 初回デプロイ

1. プロジェクト設定画面で「Deploy」をクリック
2. ビルドログを確認
3. デプロイが完了すると、`https://[プロジェクト名].vercel.app` のURLが発行されます

### 5-2. デプロイ後の確認

デプロイが完了したら、以下の確認を行ってください：

- [ ] デプロイが成功している（Vercelダッシュボードで確認）
- [ ] サイトにアクセスできる
- [ ] ログインページが表示される
- [ ] データベース接続が正常（ログイン試行など）

## ステップ6: データベースマイグレーション

### 6-1. Prismaマイグレーションの実行

Vercelではデプロイ時に自動でPrismaクライアントが生成されますが、スキーマの適用は手動で行う必要があります。

**方法1: Vercelの環境変数を使用してローカルから実行**

```bash
# 環境変数を設定（一時的に）
export DATABASE_URL="[本番環境のDATABASE_URL]"

# マイグレーション実行
npx prisma migrate deploy

# または、初回の場合
npx prisma db push
```

**方法2: Supabaseのダッシュボードを使用**

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. `prisma/migrations` フォルダ内のSQLファイルを実行

**方法3: Vercelのビルドコマンドに組み込む**

`package.json` のビルドスクリプトを更新：

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

ただし、本番環境でのマイグレーション実行は慎重に行ってください。

### 6-2. 初期データの投入（必要な場合）

テストユーザーなどの初期データを投入する場合：

```bash
# 環境変数を本番環境用に設定
export DATABASE_URL="[本番環境のDATABASE_URL]"

# テストユーザー作成
npm run create-test-user
```

## ステップ7: カスタムドメインの設定（オプション）

### 7-1. ドメインの追加

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Domains」を開く
3. 「Add Domain」をクリック
4. ドメイン名を入力（例: `manage.crane-mitsumori.com`）
5. 「Add」をクリック

### 7-2. DNS設定

Vercelから表示されるDNS設定情報を、ドメイン管理画面で設定します：

**A Record または CNAME Record を追加：**

- **CNAME（推奨）:** `manage` → `cname.vercel-dns.com`
- **A Record:** Vercelが提供するIPアドレスを指定

### 7-3. SSL証明書

Vercelが自動でSSL証明書を発行・設定します。数分から数時間かかる場合があります。

### 7-4. 環境変数の更新

カスタムドメインを設定した場合、`NEXTAUTH_URL` を更新してください：

```
NEXTAUTH_URL=https://manage.crane-mitsumori.com
```

## ステップ8: 継続的デプロイ（CI/CD）の設定

VercelはデフォルトでGit連携が有効になっています。

### 8-1. 自動デプロイの確認

- **main/masterブランチ:** Production環境に自動デプロイ
- **その他のブランチ:** Preview環境に自動デプロイ

### 8-2. デプロイ設定の調整

1. 「Settings」→「Git」でブランチ設定を確認
2. Production Branchを `main` または `master` に設定
3. プレビューデプロイの有効/無効を設定

## ステップ9: デプロイ後の動作確認

### 9-1. 基本動作の確認

以下の項目を確認してください：

- [ ] トップページが表示される
- [ ] ログインページが表示される（`/login`）
- [ ] ログイン機能が動作する
- [ ] 認証後のページ遷移が正常
- [ ] データベース接続が正常（データの取得・表示）
- [ ] APIルートが正常に動作
- [ ] レスポンシブデザインが正常に動作

### 9-2. エラーログの確認

Vercelダッシュボードの「Logs」タブで、エラーがないか確認してください。

### 9-3. パフォーマンスの確認

- Vercelの「Analytics」タブでパフォーマンスを確認
- Lighthouseなどのツールでパフォーマンススコアを確認

## トラブルシューティング

### ビルドエラーが発生する場合

1. **Prismaクライアント生成エラー:**
   - `package.json` のビルドスクリプトに `prisma generate` を追加
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build"
     }
   }
   ```

2. **環境変数が認識されない:**
   - Vercelの環境変数設定を再確認
   - 環境変数の名前が正確か確認
   - デプロイを再実行

3. **データベース接続エラー:**
   - `DATABASE_URL` が正しく設定されているか確認
   - データベースの接続許可設定を確認（IPアドレス制限など）
   - Supabaseの場合、接続プーリングを使用する場合のURL形式を確認

### ログインができない場合

1. **NEXTAUTH_URLの確認:**
   - 本番環境のURLと一致しているか確認
   - 末尾にスラッシュがないか確認

2. **NEXTAUTH_SECRETの確認:**
   - 設定されているか確認
   - 十分な長さ（32文字以上）か確認

3. **セッションクッキーの確認:**
   - ブラウザの開発者ツールでクッキーを確認
   - ドメイン設定が正しいか確認

### データベース接続ができない場合

1. **接続URLの確認:**
   - Supabaseの場合、接続プーリング用のURLを使用
   - SSLモードが有効になっているか確認

2. **ファイアウォール設定:**
   - Supabaseの場合、IPアドレスの制限を解除
   - VercelのIPアドレスを許可リストに追加

3. **マイグレーション状態:**
   - データベーススキーマが適用されているか確認
   - `prisma migrate status` で状態を確認

## セキュリティチェックリスト

- [ ] 環境変数に機密情報が含まれていないか確認（特に`.env.local`がGitにコミットされていないか）
- [ ] `NEXTAUTH_SECRET` が強力なランダム文字列であることを確認
- [ ] データベース接続URLが本番環境用であることを確認
- [ ] 不要な環境変数が公開されていないか確認
- [ ] CORS設定が適切か確認（Vercelでは自動で設定されます）
- [ ] セキュリティヘッダーが適切に設定されているか確認

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Next.jsデプロイガイド](https://nextjs.org/docs/deployment)
- [Prisma Deployガイド](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js設定](https://next-auth.js.org/configuration/options)

## 次のステップ

デプロイが完了したら、以下を検討してください：

1. **監視とロギング:**
   - VercelのAnalytics機能を有効化
   - エラー監視ツール（Sentryなど）の導入

2. **パフォーマンス最適化:**
   - 画像最適化の確認
   - バンドルサイズの最適化

3. **バックアップ:**
   - データベースの定期的なバックアップ設定
   - データエクスポートの自動化

4. **運用体制:**
   - デプロイ手順の文書化
   - 障害時の対応フローの整備

