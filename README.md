# TCG Collection note

## ファイル構成
- `index.html`：アプリ本体
- `data/poke.json`：ポケモンカードのカード一覧。初期状態は空で、GitHub Actions から取得できます
- `scripts/fetch-poke.mjs`：TCGdex の日本語カードデータ取得スクリプト
- `.github/workflows/update-data.yml`：週1回のデータ更新ワークフロー

## GitHub Pages で公開する手順
1. この ZIP の中身を GitHub リポジトリのルートにアップロードします（フォルダ構成を維持してください）。
2. GitHub の `Settings → Pages` で `Deploy from a branch`、`main`、`/(root)` を選んで保存します。
3. `Actions` タブで `update-card-data` を開き、`Run workflow` を実行します。初回のカードデータ取得には数分かかる場合があります。
4. `data/poke.json` が更新されたら GitHub Pages のサイトを再読み込みしてください。

## 注意
- ポケモンのカードデータは TCGdex のコミュニティデータを使用します。公式提供データと同一ではありません。
- 価格の自動取得は未実装です。相場はショップ検索後に手入力します。
- ワンピース・遊戯王は公式カードリストへのリンクを使う構成です。
- `data/poke.json` は今回の提供ファイルをそのまま初期データとして同梱していますが、内容は空 (`sets: []`) です。取得ワークフローを実行するとデータが入ります。
- カード情報取得は GitHub Actions 上でネットワークアクセスできる場合に限り動作します。
