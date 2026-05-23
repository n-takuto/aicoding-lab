# AI Coding ブログ 運営メモ（Claude 向け）

このファイルは、Claude（Claude Code）がこのプロジェクトを扱う際に守るべきルール集です。

## サイト基本情報

- **サイト名**: AI Coding
- **ドメイン**: aicoding-lab.com
- **テーマ**: Claude Code を中心とした AI コーディングツールの実践ブログ
- **ターゲット読者**: 日本人エンジニア（初心者〜中級）
- **ホスティング**: GitHub Pages（n-takuto/aicoding-lab）
- **ローカル開発**: `C:\Users\takut\dev\ai-coding-jp`

## 記事執筆ルール

### 必須

- **`pubDate` には必ず「今日の日付」を入れる**（未来の日付や過去の日付にしない）
- **`description` は120字程度**で記事の要約を書く（SEO重要）
- **タイトルは検索キーワードを含めつつ自然な日本語**にする
- **`H2` 見出しを5〜8個程度**で構成（スキャンしやすく）
- **記事末尾は次回予告 + ブログ宣伝**で締める

### トーン

- **フレンドリーかつ親しみやすい日本語**（「ですます調」ベース）
- 「ざっくり言うと」「ぶっちゃけ」「サクサク」など砕けた表現OK
- 専門用語は最初に説明を入れる
- 「初心者でも迷わない」を意識
- 絵文字を適度に使う（多すぎはNG）

### 構成

- リード文（記事の目的と読了後の状態を提示）
- 必要な前提（環境・知識）
- 本編（H2ごとに区切る）
- まとめ + 次回予告
- フッターのブログ紹介

### Claude 関連情報を扱うとき

- **必ず公式ドキュメント（code.claude.com / docs.anthropic.com）を最初に確認**
- バージョンや料金変更が頻繁なので、書く前に最新情報をWeb検索する
- サードパーティ情報は補助として使う

## 技術スタック

- **フレームワーク**: Astro v6（blog テンプレート）
- **デプロイ**: GitHub Actions → GitHub Pages
- **アナリティクス**: Google Analytics 4（測定ID: G-XYNVJ25782）
- **検索エンジン登録**: Google Search Console

## デプロイ手順

```powershell
git add .
git commit -m "適切なコミットメッセージ"
git push
```

push すると GitHub Actions が自動でビルド&デプロイします（約30〜60秒）。

## ローカル開発

```powershell
cd C:\Users\takut\dev\ai-coding-jp
npm run dev
```

→ http://localhost:4321/ でプレビュー

## ファイル構成のキモ

- `src/content/blog/` … 記事（Markdown）
- `src/pages/index.astro` … トップページ
- `src/pages/about.astro` … About ページ
- `src/components/Header.astro` … ヘッダー
- `src/components/Footer.astro` … フッター
- `src/components/BaseHead.astro` … メタ情報・GA タグ
- `src/styles/global.css` … サイト全体のスタイル
- `public/CNAME` … 独自ドメイン設定
- `public/favicon.svg` … ファビコン
