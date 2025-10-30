# デスクトップメモ（Electron）

簡単なデスクトップメモの骨組みです。

## 使い方（開発環境で実行）

1. Node.js と npm が必要です（macOS: https://nodejs.org/ からインストール）
2. ターミナルでプロジェクトディレクトリへ移動してください：

```bash
cd ~/Desktop/ぷろN\ /メモ\ part2
```

（パスにスペースや日本語がある場合はエスケープしてください）

3. 依存をインストールして起動します：

```bash
npm install
npm start
```

起動すると小さなウィンドウでメモアプリが表示されます。メモはブラウザの localStorage に保存されます。

## macOS アプリ化（簡易手順）

パッケージ化には `electron-packager` や `electron-builder` を利用します。簡単な例（electron-packager）:

```bash
npm install -g electron-packager
electron-packager . "DesktopMemo" --platform=darwin --arch=x64 --out=dist --overwrite
```

生成された `dist` 以下の `.app` を macOS のデスクトップに移動すれば、ダブルクリックで開けます。

注意：実際の配布やサンドボックス、署名、Notarization は別途必要です。

## 次のステップ（提案）

- localStorage ではなくローカルファイルに保存（`electron-store` やネイティブ fs を使う）
- メニューバー（Tray）からクイックで開けるようにする
- 自動起動やショートカット登録

## 追加した機能（このリポジトリに実装済み）

- トレイ（メニューバー）アイコンからのクイックオープン/非表示（クリックでトグル、コンテキストメニューあり）
- 起動時の自動起動設定（コンテキストメニューから切り替え可能、設定はアプリのユーザーデータ配下に永続化されます）
- グローバルショートカット登録（Cmd/Ctrl+Alt+M で表示/非表示）

これらは `main.js` と `settings.js` に実装されています。`settings.js` は `app.getPath('userData')` 配下の `settings.json` を読み書きします。

## GitHub に上げる際の注意点

1. .gitignore を用意する（例を下に記載）。node_modules やユーザーデータはコミットしないでください。

```
node_modules/
.DS_Store
dist/
out/
**/settings.json
/*.log
```

2. リポジトリの初期化と公開（例）:

```bash
cd ~/Desktop/ぷろN\ /メモ\ part2
git init
git add .
git commit -m "Initial commit: desktop memo app"
# GitHub リモートを追加（先に GitHub 上でリポジトリを作成してください）
git remote add origin git@github.com:yourname/desktop-memo.git
git branch -M main
git push -u origin main
```

3. シークレットやバイナリを含めないでください。アイコンやビルド成果物（dist/*.app）は .gitignore に入れるか、別途 GitHub Releases を使って配布してください。

## 次にやれること（提案）

- `electron-store` を導入して設定管理をさらに堅牢にする
- macOS 向けにアイコン（`.icns`）を追加して `electron-builder` で署名・Notarize まで行う
- GitHub Actions を追加して、push 時に自動で macOS のビルドアーティファクトを生成する

必要ならここで `npm install` と `npm start` を代行して動作確認します（あなたの許可があれば実行します）。
