# カスタムドメインDNS設定手順

## 必要なDNSレコード情報

Vercelから表示された以下の情報をドメインレジストラで設定してください：

- **Type:** `CNAME`
- **Name:** `manage`
- **Value:** `f20e7a9b2c42c5a3.vercel-dns-017.com.`（末尾にピリオドあり）

**注意:** X Serverなど一部のDNS管理システムでは、末尾のピリオド（`.`）を削除する必要があります。その場合は `f20e7a9b2c42c5a3.vercel-dns-017.com`（末尾にピリオドなし）として設定してください。

## お名前.comでの設定方法

1. **お名前.com にログイン**
   - https://www.onamae.com/ にアクセス
   - ログイン

2. **ドメイン管理画面を開く**
   - 「ドメイン」→「ドメイン管理」をクリック
   - `crane-mitsumori.com` を選択

3. **DNS設定を開く**
   - 「ネームサーバーの設定」または「DNS設定」をクリック
   - 「DNSレコード設定を利用する」を選択（ネームサーバーがお名前.comの場合）

4. **CNAMEレコードを追加**
   - 「追加」または「新規作成」をクリック
   - **ホスト名:** `manage` を入力
   - **TYPE:** `CNAME` を選択
   - **VALUE（値）:** `f20e7a9b2c42c5a3.vercel-dns-017.com.` を入力
     - **注意:** 末尾のピリオド（`.`）も含めて入力してください
   - **TTL:** `3600` またはデフォルト値
   - 「設定」または「保存」をクリック

5. **設定を確認**
   - 追加したレコードが正しく表示されているか確認
   - 保存

## ムームードメインでの設定方法

1. **ムームードメインにログイン**
   - https://www.muumuu-domain.com/ にアクセス
   - ログイン

2. **ドメイン管理画面を開く**
   - 「ドメイン」→「ドメイン設定」をクリック
   - `crane-mitsumori.com` を選択

3. **DNS設定を開く**
   - 「DNS関連機能の設定」をクリック
   - 「DNSレコード設定を利用する」を選択

4. **CNAMEレコードを追加**
   - 「DNSレコード設定」タブを開く
   - 「追加」をクリック
   - **サブドメイン:** `manage` を入力
   - **タイプ:** `CNAME` を選択
   - **内容（値）:** `f20e7a9b2c42c5a3.vercel-dns-017.com.` を入力
     - **注意:** 末尾のピリオド（`.`）も含めて入力してください
   - 「設定する」をクリック

5. **設定を確認**
   - 追加したレコードが正しく表示されているか確認

## X Serverでの設定方法

1. **X Serverにログイン**
   - https://www.xserver.ne.jp/ にアクセス
   - サーバーパネルにログイン

2. **ドメイン設定画面を開く**
   - 「ドメイン設定」をクリック
   - 「ドメイン設定追加・削除」または「ドメイン一覧」をクリック
   - `crane-mitsumori.com` を選択

3. **DNSレコード設定を開く**
   - 「DNSレコード設定を利用する」または「DNS設定」をクリック
   - ネームサーバーがX Serverの場合、DNSレコード設定が利用可能です

4. **CNAMEレコードを追加**
   - 「DNSレコード設定」画面で「新規作成」または「追加」をクリック
   - **ホスト名:** `manage` を入力
   - **タイプ:** `CNAME` を選択
   - **値（内容）:** `f20e7a9b2c42c5a3.vercel-dns-017.com` を入力
     - **重要:** X Serverでは末尾のピリオド（`.`）を**付けない**でください
     - Vercelが表示する値から末尾のピリオドを削除して入力してください
     - 例: `f20e7a9b2c42c5a3.vercel-dns-017.com.` → `f20e7a9b2c42c5a3.vercel-dns-017.com`
   - **TTL:** `3600` またはデフォルト値
   - **優先度:** `0` または空欄
   - 「確認画面へ進む」をクリック

5. **設定を確認**
   - 追加したレコードが一覧に表示されているか確認
   - 値が正しいか再確認（特に末尾のピリオド）

**注意:** 
- X Serverでは、ネームサーバーがX Serverの場合のみDNSレコード設定が可能です
- ネームサーバーが他のサービス（例: Cloudflare）に設定されている場合は、そちらのDNS設定画面で設定してください

## その他のドメインレジストラでの設定方法

一般的な手順：

1. **ドメインレジストラにログイン**

2. **DNS設定画面を開く**
   - 「DNS設定」「ネームサーバー設定」「DNSレコード設定」など、名称はレジストラにより異なります

3. **CNAMEレコードを追加**
   - レコードタイプで `CNAME` を選択
   - **ホスト名（Name）:** `manage`
   - **値（Value/Target）:** `f20e7a9b2c42c5a3.vercel-dns-017.com.`
     - **重要:** 末尾のピリオド（`.`）を含めてください

4. **保存**

## 設定後の確認

### 1. DNS設定の反映確認

設定後、数分〜数時間待ってから以下で確認：

**Windowsの場合（PowerShellまたはコマンドプロンプト）:**
```bash
nslookup manage.crane-mitsumori.com
```

**Mac/Linuxの場合:**
```bash
dig manage.crane-mitsumori.com
```

または、オンラインツールを使用：
- https://dnschecker.org/
- https://www.whatsmydns.net/

上記ツールで、`manage.crane-mitsumori.com` が `f20e7a9b2c42c5a3.vercel-dns-017.com.` に解決されていることを確認してください。

### 2. Vercelでの確認

1. Vercelダッシュボードで「Domains」を開く
2. `manage.crane-mitsumori.com` の状態を確認
3. 「Invalid Configuration」が「Valid Configuration」に変われば設定完了

### 3. SSL証明書の確認

DNS設定が反映されると、Vercelが自動でSSL証明書を発行します（数分〜数時間）。

- 「Domains」画面で「Valid」と表示されれば完了
- ブラウザで `https://manage.crane-mitsumori.com` にアクセスして、鍵アイコン（🔒）が表示されることを確認

## 環境変数の更新（重要）

DNS設定が反映され、ドメインでアクセスできるようになったら：

1. **Vercelダッシュボードでプロジェクトを選択**
2. **「Settings」→「Environment Variables」を開く**
3. **`NEXTAUTH_URL`を編集**
4. **新しいドメインのURLに更新:**
   ```
   https://manage.crane-mitsumori.com
   ```
   - **注意:** 末尾にスラッシュ（`/`）を付けないでください
5. **「Save」をクリック**
6. **再デプロイを実行**（環境変数の変更は再デプロイ後に反映されます）
   - 最新のデプロイを選択して「Redeploy」をクリック
   - または、新しいコミットをプッシュ

## よくある問題と解決方法

### 問題1: DNS設定が反映されない

**解決方法:**
- DNS設定の反映には通常数分〜最大48時間かかります
- 数時間待ってから再度確認
- DNS設定が正しいか再確認（特に末尾のピリオド）
- `nslookup` や `dig` コマンドでDNS設定を確認

### 問題2: CNAMEレコードが保存できない

**原因:** ルートドメイン（`crane-mitsumori.com`）でCNAMEレコードを使用しようとしている可能性があります。

**解決方法:**
- サブドメイン（`manage`）にのみCNAMEレコードを設定してください
- ルートドメインの場合は、Vercelが提供するAレコードを使用してください

### 問題3: 「Invalid Configuration」のまま変わらない

**解決方法:**
- DNS設定が正しく反映されているか確認
- Vercelの「Domains」画面で「Refresh」ボタンをクリック
- 数時間待ってから再度確認
- DNS設定の値（Value）が正しいか確認（末尾のピリオドを含む）

### 問題4: SSL証明書が発行されない

**解決方法:**
- DNS設定が正しく反映されているか確認
- 数時間待ってから再度確認
- ドメインがVercelに正しく接続されているか確認

## 参考リンク

- [Vercel公式ドキュメント: カスタムドメインの追加](https://vercel.com/docs/concepts/projects/domains/add-a-domain)
- [Vercel公式ドキュメント: DNS設定](https://vercel.com/docs/concepts/projects/domains/configure-a-domain)

