# AIが書いた研究論文5本の評価（E2）

研究者に、AIの研究システムが書いた5本の論文を評価していただくためのページです。GitHub Pages で公開します。

- 評価者は、依頼メールで知らされた評価者ID（例：R1）を入れます。論文を読む順番は、IDから決まります（`app.js` の `orderFor`）。
- 回答はサーバーに送られません。評価者のブラウザ（localStorage）に保存されます。評価者は、回答をJSONファイルに書き出して、メールで送ります。
- 評価の項目と6つの観点の定義は、AI査読者による評価（E1）の指示文と同じです。数値の項目は必須で、文章の項目は任意です。書き出すJSONの `review` は、E1 の出力と同じフィールド名を使います。
- 検索エンジンには載せない設定にしています（`noindex`）。

## ファイル

| ファイル | 内容 |
|---|---|
| `index.html`, `style.css`, `app.js` | 依頼文と評価用紙（評価用紙 v1.0） |
| `papers/run-014.pdf` … `run-018.pdf` | 評価する5本の論文。E1 で評価したPDFと同じファイル |

論文PDFの SHA-256：

```
7f050169441b485f1898f46fd26c5032472f125156f6dfc93725104571eec579  run-014.pdf
f417ac6b8dc0c98bb87c1065b2f2e630f68042dd2355e475b547bd8477c3884c  run-015.pdf
6080e5e8c7c61772db85e8b533204faa5d8445feea0faf21f9935960003e4ebe  run-016.pdf
976584879e22a1fa536e7f1f68ee3acd3e6b53719d2787f73dfd2ae7ae5a0f93  run-017.pdf
f420451e045d6d85b79445fbdd907d3aa90ba2e01abc03ba14cdee7c7e9ea57b  run-018.pdf
```

## ライセンス

- このページのコード：MIT License（`LICENSE`）
- 論文PDF：CC BY 4.0（`LICENSE-CC-BY-4.0.txt`）。著者表示は Autonomous Research Agents です。出典は、リポジトリ kofujimura/autonomous-research-agents の `release/papers/` です。

---

# Evaluation of five AI-written research papers (E2)

This page asks researchers to rate five papers written by an autonomous AI research system. Responses stay in the rater's browser and are sent by e-mail as a JSON file. The rating items follow the AI-reviewer evaluation (E1). Code: MIT. Paper PDFs: CC BY 4.0.
