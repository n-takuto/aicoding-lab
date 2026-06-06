---
title: 'MCPとは？Claude Codeを外部ツールに繋げる仕組み'
description: 'MCP（Model Context Protocol）とは、Claude Codeを外部ツールやサービスに接続する仕組みです。スコープの概念や代表的な対応サービスも紹介。Brave Searchで実際に試したセットアップ手順と使い方を初心者向けに解説します。'
category: 'tips'
pubDate: '2026-06-04T12:00:00'
updatedDate: '2026-06-06T20:00:00'
---

Claude Code はコードを書くだけじゃなく、外部ツールやサービスと「繋いで」使えます。<br>
その仕組みが **MCP（Model Context Protocol）** です。

「なんか難しそう」と思ったかもしれませんが、やってること自体はシンプルです。<br>
私も先日 Brave Search MCP を実際に試して、Claude がリアルタイムでウェブ検索できるようになりました。この記事では、MCPの概念から実際のセットアップまでをまとめます。

## MCPとは？一言で言うと

**MCP（Model Context Protocol）は、AI と外部ツールを繋ぐオープンな規格**です。

もう少し具体的に言うと、「Claude Code に Slack を操作させる」「Claude Code にデータベースを読み込ませる」「Claude Code にウェブ検索させる」といったことができる仕組みです。

> MCP は USB のような存在です。USB がどんな機器でも同じ規格で繋げるように、MCP はどんな外部サービスでも Claude と繋げるための統一規格として設計されています。

従来は「外部サービスを使いたければ、そのAPIの仕様を調べてコードを書いて…」という手順が必要でした。MCP があると、対応サービスであれば設定するだけで Claude が直接そのサービスを操作できます。

## MCPで何ができるか

公式ドキュメントに載っている例がわかりやすいので紹介します（2026年6月確認）。

| やりたいこと | MCPを使った例 |
|------------|------------|
| タスク管理との連携 | 「JIRAの課題○○に書いてある機能を追加して」 |
| データ分析 | 「PostgreSQLのデータで先月の売上を出して」 |
| デザイン連携 | 「Figmaの最新デザインに合わせてCSSを更新して」 |
| コミュニケーション | 「Slackに投稿された要件を元にコードを書いて」 |
| ウェブ検索 | 「Claude Codeの最新アップデートを調べて」 |

一言でまとめると、**「コピペして渡していたものを、MCPで直接取りに行かせる」** イメージです。

## MCPの仕組みをざっくり理解する

MCP には「クライアント」と「サーバー」という概念があります。

**MCPクライアント**は Claude Code 本体のことです。<br>
**MCPサーバー**は、外部サービスとのやり取りを担当するプログラムです。

```
Claude Code（クライアント） ←→ MCPサーバー ←→ 外部サービス（Slack/DBなど）
```

「MCPサーバー」という名前ですが、自分のパソコン上で動くもの（stdio方式）と、インターネット上のサービスとして動くもの（HTTP方式）があります。

| 方式 | 動作場所 | 向いているケース |
|------|---------|--------------|
| stdio | 自分のPC上 | ローカルツール、npmパッケージで提供されるもの |
| HTTP | インターネット上 | クラウドサービス（Slack、Notion等） |

自分で何かを作るわけではないので、「設定ファイルに書くだけ」と思ってもらえれば十分です。

## MCPサーバーの設定範囲（スコープ）

スコープとは「どのプロジェクトで有効にするか」という設定の有効範囲のことです。3種類あります。

| スコープ | 有効範囲 | 保存場所 |
|---------|--------|--------|
| **local（デフォルト）** | 今のプロジェクトだけ | `~/.claude.json` |
| **project** | チーム共有（バージョン管理） | `.mcp.json`（プロジェクト内） |
| **user** | 自分の全プロジェクト | `~/.claude.json` |

個人で使う場合は **user スコープ**が便利です。一度設定すれば、どのプロジェクトでも使えます。

例えば、ウェブ検索用の MCP サーバーを user スコープで設定しておけば、どの作業中でも「最新情報を調べて」と言うだけで Claude が検索してくれます。

## 実際にBrave Search MCPを試した話

先日、実際に Brave Search MCP を設定して Claude にウェブ検索させてみました。

### Brave Search MCPとは

Brave Search が提供する MCP サーバーで、Claude にリアルタイムのウェブ検索機能を追加できます。無料プランで月 $5 分のクレジットが付いてきます（Searchプランで最大約1,000回分）。

### 設定の流れ

**① Brave Search API に登録する**<br>
[Brave Search API のサイト](https://brave.com/search/api/) でアカウントを作成します。最初は左のメニューが並んでいるだけの状態です。

![Brave Search API ダッシュボードのサイドバー](/images/what-is-mcp/01-brave-api-dashboard.png)

「API keys」を開いても、最初はまだサブスクリプションがないのでキーを作れません。

![API keys ページ：サブスクリプションなし](/images/what-is-mcp/02-api-keys-no-subscription.png)

「Available plans」からプランを選びます。今回は Search プラン（$5.00/1,000件）を選択。毎月 $5 分の無料クレジットが自動付与されます。

![利用可能なプラン一覧](/images/what-is-mcp/03-available-plans.png)

サブスクリプション確認画面では「Free」（$5.00/mo in free credits）を選んで Continue。請求は発生しません。

![サブスクリプション確認ダイアログ](/images/what-is-mcp/04-confirm-subscription.png)

**ここで注意点があります。** 無料プランを選んでいても、支払い情報の登録画面が表示されます。カード情報を入力しないと次に進めません。「無料なのにカード？」と驚くかもしれませんが、月の上限（$5クレジット）を超えた分に備えた登録です。Free プランのままなら請求は発生しません。

![支払い情報の登録画面（無料プランでも表示される）](/images/what-is-mcp/05-payment-form.png)

登録が完了すると「Subscription successful!」と表示されます。「Add API key」ボタンをクリックします。

![サブスクリプション完了](/images/what-is-mcp/06-subscription-success.png)

API キーの名前を入力して「Add」を押します（名前は何でも OK）。

![API キー作成ダイアログ](/images/what-is-mcp/07-add-api-key-dialog.png)

作成されたキーが一覧に表示されます。この画面でキーをコピーしておきます。

![API キー一覧](/images/what-is-mcp/08-api-keys-list.png)

**② API キーを環境変数に設定する**<br>
取得した API キーをコピーしたら、PC の環境変数に設定します。PowerShell を開いて以下を実行してください（`YOUR_KEY` の部分を実際のキーに置き換える）。

```powershell
[System.Environment]::SetEnvironmentVariable("BRAVE_API_KEY", "YOUR_KEY", "User")
```

`"User"` を指定することで、再起動後も永続的に有効になります。

> ⚠️ **API キーを設定ファイルに直書きしない**。設定ファイルはバックアップや同期ツールでクラウドに上がることがあります。環境変数に入れておけばキー本体がファイルに残りません。

**③ `~/.claude.json` に設定を追加する**<br>
環境変数の準備ができたら、Claude Code の設定ファイルに以下を追記します。`${BRAVE_API_KEY}` と書くと、Claude Code が起動時に環境変数の値を自動で読み込みます。

```json
{
  "mcpServers": {
    "brave-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server", "--transport", "stdio"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

**③ Claude Code を再起動する**<br>
設定を保存してアプリを再起動すると、brave-search MCP が接続されます。

### 実際に使ってみた

接続が確認できたら、実際に動かしてみます。「brave-search MCP が使えるか確認して」と聞くと、利用可能なツールが表示されました。

![brave-search MCP の動作確認](/images/what-is-mcp/10-brave-search-confirmed.png)

「Claude Code の最新情報を検索して」と伝えたところ、2026年5月のアップデート情報が返ってきました。

### 「普通に調べてくれるよね？」問題

ここで正直に書いておきます。

Claude Code にはもともと **WebSearch** という組み込みのキーワード検索ツールがあります。「〇〇を調べて」と言うと、Anthropic のバックエンドで検索して URL のリストを取得し、さらに **WebFetch** でそのページを読む、という流れで動いています。

つまり、**Brave Search MCP がなくてもキーワード検索はできます**。

では Brave Search MCP と何が違うのか。公式ドキュメントにこう書いてあります：

> *「WebSearch のバックエンドは変更できない。別のプロバイダーで検索したければ MCP サーバーを追加せよ。」（[公式 tools reference](https://code.claude.com/docs/en/tools-reference#websearch-tool-behavior) より）*

つまり、違いは**どの検索エンジンを使うか**です。

| | WebSearch（組み込み） | Brave Search MCP |
|---|---|---|
| 何をするか | キーワード検索 | キーワード検索 |
| 検索エンジン | Anthropic のバックエンド（非公開） | Brave の独自インデックス |
| ローカル検索 | ❌ | ✅（`brave_local_search`） |
| 検索エンジンの変更 | ❌ できない | ✅ Brave に固定 |

**正直なところ、普段使いでは差をほぼ感じません。**<br>
Brave Search を使う主な理由は「Google・Bing に依存しない独自インデックス」「プライバシー重視」「近くの店・場所を調べる local search が使える」あたりです。検索結果の質にこだわりたい人や、ローカル検索を使いたい人向けの追加オプション、と思ってもらうのが正確です。

### ハマったこと

設定ファイルの編集で少し詰まりました。`~/.claude.json` は普通のJSONに見えますが、**PowerShellのJSONパーサーと相性が悪い**ファイルです。

具体的には：
- パス内に日本語フォルダ名（Shift-JIS 系バイト列）が含まれる
- `\Claudecode` のように `\C` という不正なJSONエスケープが含まれる

これらのせいで PowerShell の `ConvertFrom-Json` がエラーを出し、ファイルが壊れかけました。

⚠️ `~/.claude.json` を編集するときは **PowerShell のJSONツールを使わない**。Edit ツールやテキストエディタで直接編集するのが安全です。

## 対応サービスはどれくらいある？

2026年6月時点で、MCPに対応したサービスは多数あります。Anthropic が公式ディレクトリを公開しており、レビュー済みのサーバーを一覧で確認できます。

代表的なものを紹介します：

| サービス | できること |
|---------|---------|
| GitHub | Issue・PRの作成・確認 |
| Slack | メッセージ送信・検索 |
| Notion | ページの読み書き |
| PostgreSQL | DBのクエリ実行 |
| Brave Search | リアルタイムウェブ検索 |
| Sentry | エラーログの確認 |
| Figma | デザインデータの参照 |

Claude Code デスクトップ版では、サイドバーの「Connectors」からGUI操作で追加できるものもあります。

![Connectors マーケットプレイス](/images/what-is-mcp/09-connectors-marketplace.png)

## まとめ

| | ポイント |
|----|------|
| MCPとは | AI と外部ツールを繋ぐオープンな規格 |
| できること | ウェブ検索・DB操作・Slack送信など |
| 設定方法 | `~/.claude.json` に JSON で記述 |
| スコープ | local / project / user の3段階 |

MCP を使うと、Claude Code が「コードを書くツール」から「外部サービスを巻き込んで作業するエージェント」に変わります。<br>
まず試すなら **Brave Search MCP**（無料・設定シンプル）がおすすめです。リアルタイムの情報を調べながら作業できる体験は、一度使うと手放せなくなります。

### 関連記事

- 📖 [Claude Code とは？できること・料金・他ツールとの違い](/blog/what-is-claude-code/)
- 🛠️ [Claude Code を入れたら最初に試す便利コマンド5選](/blog/claude-code-first-commands/)
- 💰 [Claude Code Pro のトークンを節約する5つの方法](/blog/claude-code-token-tips/)

---

このブログでは、Claude Code の使い方を**実際に試した体験ベース**で発信しています。お気に入り登録お願いします 🙌
