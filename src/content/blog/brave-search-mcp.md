---
title: 'Brave Search MCPの使い方と検索結果を確認してみた'
description: 'Claude Code に Brave Search MCP を設定して、brave_web_search と brave_local_search を実際に使ってみました。検索結果の見え方・2ツールの使い分け・レートリミットのハマりポイントまで初心者向けに正直に解説します。'
category: 'tips'
pubDate: '2026-06-06T22:00:00'
---

Claude Code にウェブ検索をさせたい、でもどうやって？というときに活躍するのが **Brave Search MCP** です。

MCP（Model Context Protocol）とは、Claude Code を外部ツールに接続するための仕組みです。詳しくは[MCPとは？Claude Codeを外部ツールに繋げる仕組み](/blog/what-is-mcp/)で解説しています。

設定すると Claude Code が自分でウェブ検索できるようになります。この記事では、実際にセットアップして `brave_web_search` と `brave_local_search` の2つのツールを試してみた結果をまとめます。

## Brave Search MCPでできること

Brave Search MCP を設定すると、Claude Code が使えるツールが2つ増えます。

| ツール | 用途 |
|--------|------|
| `brave_web_search` | キーワード検索（一般的なウェブ検索） |
| `brave_local_search` | 近くのお店・場所を検索（ローカル検索） |

「Claude Code にはもともと検索機能あるのでは？」と思った方、正解です。<br>
Claude Code には組み込みの `WebSearch` ツールがあり、Anthropic のバックエンド経由でウェブ検索できます。

Brave Search MCP との違いは**検索エンジン**です。

| | WebSearch（組み込み） | Brave Search MCP |
|---|---|---|
| 検索エンジン | Anthropicのバックエンド（非公開） | Brave の独自インデックス |
| ローカル検索 | ❌ | ✅（`brave_local_search`） |
| 設定変更 | ❌ | ✅ |

普段の調べものは組み込みの WebSearch で十分です。Brave Search MCP を使う主な理由は「**ローカル検索（近くのお店調べ）**」か「**Brave の独自インデックスで検索したい**」場合です。

## セットアップ手順

### ① Brave Search API に登録する

[Brave Search API のサイト](https://brave.com/search/api/) でアカウントを作成します。最初は左のメニューが並んでいるだけの状態です。

![Brave Search API ダッシュボードのサイドバー](/images/what-is-mcp/01-brave-api-dashboard.png)

「API keys」を開いても、最初はまだサブスクリプションがないのでキーを作れません。

![API keys ページ：サブスクリプションなし](/images/what-is-mcp/02-api-keys-no-subscription.png)

「Available plans」から Search プランを選びます。無料プランで毎月 **$5 分のクレジット**が自動付与されます（= 約1,000回分）。

![利用可能なプラン一覧](/images/what-is-mcp/03-available-plans.png)

サブスクリプション確認画面では「Free」（$5.00/mo in free credits）を選んで Continue。

![サブスクリプション確認ダイアログ](/images/what-is-mcp/04-confirm-subscription.png)

> ⚠️ 無料プランでも支払い情報の登録が必要です。「無料なのにカード？」と驚くかもしれませんが、月の無料枠（$5）を超えない限り請求は発生しません。

![支払い情報の登録画面（無料プランでも表示される）](/images/what-is-mcp/05-payment-form.png)

登録が完了すると「Subscription successful!」と表示されます。「Add API key」ボタンをクリックします。

![サブスクリプション完了](/images/what-is-mcp/06-subscription-success.png)

API キーの名前を入力して「Add」を押します（名前は何でも OK）。

![API キー作成ダイアログ](/images/what-is-mcp/07-add-api-key-dialog.png)

作成されたキーが一覧に表示されます。この画面でキーをコピーしておきます。

![API キー一覧](/images/what-is-mcp/08-api-keys-list.png)

### ② API キーを環境変数に設定する

取得したキーは、設定ファイルに直書きせず**環境変数に保存**します。PowerShell を開いて以下を実行してください。

```powershell
[System.Environment]::SetEnvironmentVariable("BRAVE_API_KEY", "YOUR_KEY", "User")
```

`"User"` を指定することで、PC を再起動しても永続的に有効になります。

> ⚠️ **API キーを設定ファイルに直書きしない**。設定ファイルはバックアップや同期ツールでクラウドに上がることがあります。環境変数に入れておけばキー本体がファイルに残りません。

### ③ `~/.claude.json` に設定を追加する

Claude Code の設定ファイルに以下を追記します。`${BRAVE_API_KEY}` と書くと、Claude Code が起動時に環境変数の値を自動で読み込みます。

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

### ⚠️ ~/.claude.json の編集に注意

`~/.claude.json` は普通の JSON ファイルに見えますが、**PowerShell の JSON ツールと相性が悪い**です。

具体的には：
- パス内に日本語フォルダ名（Shift-JIS 系バイト列）が含まれる
- `\Claudecode` のように `\C` という不正な JSON エスケープが含まれる

これらのせいで PowerShell の `ConvertFrom-Json` がエラーを出し、ファイルが壊れかけました。

`~/.claude.json` を編集するときは **PowerShell の JSON ツールを使わない**。Claude Code の Edit ツールやテキストエディタで直接編集するのが安全です。

### ④ Claude Code を再起動する

設定を保存してアプリを再起動すると、brave-search MCP が接続されます。

> 💡 `"type": "stdio"` は MCP サーバーをローカル（自分のPC上）で動かす方式です。インターネット上のサービスではなく、npx コマンドで起動するプロセスと通信します。

## brave_web_searchを使ってみた

「Claude Code 使い方」で実際に検索してみました。

![brave_web_search のツール呼び出し](/images/brave-search-mcp/01-brave-web-search-calling.png)

`brave-search: brave web search を使用中` と表示され、ツールが呼ばれていることが確認できます。

結果はこんな感じで返ってきます。

![brave_web_search の検索結果](/images/brave-search-mcp/02-brave-web-search-results.png)

日本語記事と公式ドキュメントが**表形式**で整理されて返ってきました。タイトル・URL・説明文がセットになっていて、そのまま参考にしやすい形です。

Claude に「調べた内容をもとにまとめて」と続けて指示すれば、検索→整理→回答まで一気にやってくれます。

## brave_local_searchとは？

`brave_local_search` は、**近くのお店や場所を調べる**ためのツールです。

```
「新宿でラーメン屋を探して」
「東京駅近くのカフェは？」
```

こういったクエリに対して、以下の情報を返します。

| 返ってくる情報 |
|--------------|
| 店名・住所 |
| 評価（星の数・レビュー件数） |
| 電話番号 |
| 営業時間 |

組み込みの `WebSearch` ではこういったローカル検索はできません。**「近くの〇〇」系のクエリは brave_local_search の独壇場**です。

## 試したらレートリミットに当たった

正直に書きます。

`brave_local_search` を試そうとしたところ、**「Rate limit exceeded」エラー**が返ってきました。

```
Error: Rate limit exceeded
```

月間クエリ数（1,000回）は全然使っていなかったので、**短時間に連続リクエストしたことによるバースト制限**に引っかかったようです。

数分待って再試行すれば解消します。焦って何度も叩くと逆効果なので、エラーが出たら少し待つのが正解です。

> バースト制限とは、短時間に大量のリクエストを送ることへのブレーキです。月間の上限とは別に、「1分あたり○回まで」という制限がかかっています。

## まとめ

| | brave_web_search | brave_local_search |
|---|---|---|
| 用途 | 一般的なウェブ検索 | 近くのお店・場所を検索 |
| 返ってくるもの | タイトル・URL・説明文 | 店名・住所・評価・電話・営業時間 |
| 普段使いに | ◎ | 「近くの〇〇」系クエリに |

Brave Search MCP は、設定さえしてしまえば Claude Code から自然に使えます。「調べて」と一言言うだけで、適切なツールを選んで検索してくれるのが便利なところです。

ローカル検索は組み込みの WebSearch では代替できない機能なので、「近くのお店を調べながら作業したい」という用途には特に重宝します。

### 関連記事

- 📖 [MCP とは？Claude Code を外部ツールに繋げる仕組み](/blog/what-is-mcp/)
- 🛠️ [Claude Code を入れたら最初に試す便利コマンド5選](/blog/claude-code-first-commands/)
- 💰 [Claude Code Pro のトークンを節約する5つの方法](/blog/claude-code-token-tips/)

---

このブログでは、Claude Code の使い方を**実際に試した体験ベース**で発信しています。お気に入り登録お願いします 🙌
