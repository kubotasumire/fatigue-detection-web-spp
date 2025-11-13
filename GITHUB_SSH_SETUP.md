# GitHub SSH キー設定手順

このドキュメントでは、ローカルから GitHub へ SSH 経由でコードを push する手順を説明します。

---

## ステップ 1: ローカルの SSH キーペアを確認

ローカルに SSH キーペアが存在するか確認します。

```bash
ls -la ~/.ssh/id_rsa_new*
```

出力例：
```
-rw-------  1 user  staff  3401 Nov  9 10:27 /Users/user/.ssh/id_rsa_new
-rw-r--r--  1 user  staff   758 Nov  9 10:27 /Users/user/.ssh/id_rsa_new.pub
```

**ステータス**: ✅ キーペアが存在します

---

## ステップ 2: SSH Config ファイルを確認

SSH がローカルキーを正しく使用するよう設定されているか確認します。

```bash
cat ~/.ssh/config
```

以下のような内容が表示されることを確認してください：

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_new
    AddKeysToAgent yes
    IgnoreUnknown UseKeychain
    UseKeychain yes
```

**ステータス**: ✅ SSH Config が正しく設定されています

---

## ステップ 3: ローカルの公開鍵を表示

GitHub に登録するための公開鍵を表示します。

```bash
cat ~/.ssh/id_rsa_new.pub
```

出力例：
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDKSFhWQF/6NwtbHsgDhkgnu+iD5JXa5QeD9a/yA10/GDCFHxZMNiPeaa7MIHKNe9jubR8f29ReTb3D70vz3Vayh8wwnUkvQmdACQcJVlYFx4R2lA97mBZk1V7bDuEL7Z2QwXxyjcCZJONB3qg6cQJHqv9KLmnnFPSTWWc+1/isog7xnDNTtU9iP/2Ih2yaSeb/GkVeTwpTXdi7Yz6ARJPVhBcxD+7mBsewCKQXGqgys5ZvLUxmLiTUZgpMwH/mJtdbp0O8ChqhK3HbxH/DgYIEJSC9u8I0wRFtRHA3kYItARw+EAa3MnDSiRvyW9TVotpbeRgE4rN9VMi9XJInk6Dq/x97tLse5Gb9xEILmqWp9Nxk3oLT4dLdjtaMXhghWZ/MW9Zbproec0dTbxMicUZNvU2EhIEUWlvPcqElWvv1K+XuwoBnjVLd4/cxFi+IE+7l+sUmEIGVI0RiHSbzu3W70N0jU+L4v3j2JFsI1+XKNKADSdXPFT9LeAAarKLPULZG4Cq5AhRZSfokvfCpWX+CRSnTkHWU9juKVdiwO7Ks4c6Y3eN2HB+j03i28FgXxtr3wWRyWZi1ksfg6Sb1CGc0WK+2iiJ0PpR+rcNJgOsulo8q3FuLe+BN65YLcfJCofpuEL/TVSsDEusbwZJgAyPYXg3MG0QUQOgJRiZcMxLDHw== kubotasumire@MacBook-Air-9.local
```

**この鍵全体をコピーして、次のステップで GitHub に登録します。**

---

## ステップ 4: GitHub に SSH キーを登録

1. **https://github.com/settings/keys** にアクセス
2. **New SSH key** をクリック
3. 以下を入力：
   - **Title**: `MacBook Air Fatigue Detection`
   - **Key type**: `Authentication Key`
   - **Key**: ステップ 3 でコピーした公開鍵全体を貼り付け
4. **Add SSH key** をクリック

GitHub がキーを登録すると、フィンガープリント（SHA256:...）が表示されます。このフィンガープリントをメモしておいてください。

---

## ステップ 5: SSH 接続をテスト

GitHub に SSH で接続できるか確認します。

```bash
ssh -T git@github.com
```

**成功した場合の出力：**
```
Hi kubotasumire! You've successfully authenticated, but GitHub does not provide shell access.
```

**失敗した場合：**
エラーが出た場合は、以下を確認してください：

1. GitHub に登録されたキーのフィンガープリント
2. ローカルキーのフィンガープリント：
   ```bash
   ssh-keygen -lf ~/.ssh/id_rsa_new.pub
   ```
3. 2つが一致しているか確認

---

## ステップ 6: git リモート URL を確認

```bash
git remote -v
```

出力例：
```
origin	git@github.com:kubotasumire/fatigue-detection-web-spp.git (fetch)
origin	git@github.com:kubotasumire/fatigue-detection-web-spp.git (push)
```

**ステータス**: ✅ SSH 形式の URL が設定されています

---

## ステップ 7: git push を実行

コードを GitHub に push します。

```bash
git push -u origin main
```

**成功した場合の出力：**
```
Counting objects: ...
Delta compression using up to 8 threads.
Compressing objects: 100% (...)
Writing objects: 100% (...)
Total ... (delta ...), reused ...
remote:
remote: Create a pull request for 'main' on GitHub by visiting:
remote:      https://github.com/kubotasumire/fatigue-detection-web-spp/pull/new/main
...
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

**これで GitHub へのコード同期が完了しました！**

---

## トラブルシューティング

### SSH 接続が失敗する場合

```bash
# SSH 接続をデバッグモードで実行
ssh -vvv git@github.com
```

ログを見て、以下を確認：
- `identity file /Users/user/.ssh/id_rsa_new type 0` が表示されているか
- `Permission denied (publickey)` エラーが出ていないか

### git push がエラーになる場合

```bash
# git の詳細ログを表示
GIT_SSH_COMMAND="ssh -vvv" git push -u origin main
```

---

## 次のステップ

GitHub へのコード同期が完了したら、Render へのフロントエンドデプロイに進んでください。

詳細は `RENDER_DEPLOYMENT.md` を参照してください。
