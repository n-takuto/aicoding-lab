---
title: 'Claude Code Routines でブログのリンク切れを週1自動チェックする'
description: 'Claude Code の Routines を使って、ブログのリンク切れチェックを毎週自動化しました。PC がオフでも動くクラウド実行の仕組み、ネットワーク制限のハマりポイント、Claude の誤検知問題と専用ツールで精度を上げた方法まで正直に解説します。'
category: 'routines'
pubDate: '2026-06-10T21:00:00'
---

ブログの記事が増えてくると、いつの間にかリンク切れが発生することがあります。でも毎週手動でチェックするのは面倒。

そこで **Claude Code の Routines** を使って、自動チェックを組んでみました。この記事では、セットアップ手順だけでなく、途中でハマったポイントも正直に書いています。

## Routines とは？

Routines は、Claude Code のタスクを **Anthropic のクラウドで自動実行する**機能です。

ポイントは「クラウドで動く」こと。自分の PC を閉じていても、アプリを起動していなくても、設定したスケジュールで自動的に実行されます。

トリガーは3種類あります。

| トリガー | 内容 |
|---------|------|
| **スケジュール** | 毎日・毎週など定期実行 |
| **API** | HTTP POST でオンデマンド実行 |
| **GitHub イベント** | PR（プルリクエスト）作成・リリースなどに反応して実行 |

今回はスケジュールトリガーを使って、毎週月曜18時にリンクチェックを走らせます。

> ⚠️ Routines は現在「リサーチプレビュー」段階です。仕様が変更される可能性があります。

## ルーティンを作ってみた

デスクトップ版の左サイドバーから「Routines」を開くと、こんな画面が出てきます。

![Routines トップ画面](/images/claude-code-routines/01-routines-home.png)

「何を自動化しますか？」の入力欄に日本語で入力するだけでルーティンを作れます。

```
毎週月曜に aicoding-lab.com のリンク切れをチェックする
```

と入力して「ルーティンを作成」を押すと、Claude が自動で詳細な指示・名前・トリガーを設定してくれました。

![ルーティン作成画面（自動生成された設定）](/images/claude-code-routines/02-create-routine.png)

- **名前**: Weekly link check
- **指示**: サイトをクロールして4xx/5xxエラーをチェック
- **トリガー**: 毎週月曜 18:00 JST

「作成」を押すと、ルーティンが登録されます。

![作成完了・アクティブ状態](/images/claude-code-routines/03-routine-created.png)

「アクティブ」と表示され、次回実行日時も出てきました。「今すぐ実行」ボタンで即座にテストもできます。

## ハマりポイント：ネットワーク制限

さっそく「今すぐ実行」を押してみると、エラーになりました。

![ネットワークエラー発生](/images/claude-code-routines/04-network-error.png)

```
Anthropic's egress proxy blocks outbound requests to aicoding-lab.com
with host_not_allowed
```

**Routines が動くクラウド環境は、デフォルトでは外部ドメインへのアクセスがブロックされています。**

`aicoding-lab.com` はデフォルトの許可リストに入っていないので、アクセスできなかったというわけです。

### 解決策：許可ドメインを追加する

ルーティンの編集画面を開き、指示欄の下にある「⛅ Default」をクリックして環境一覧を表示します。「Default」にマウスを乗せると右側に歯車アイコンが出るので、それをクリックします。

![環境編集画面](/images/claude-code-routines/05-edit-environment.png)

「クラウド環境を更新」が開いたら、「ネットワークアクセス」を「Trusted」→「**カスタム**」に変更します。

![クラウド環境設定（Trusted）](/images/claude-code-routines/06-cloud-env-trusted.png)

「許可されたドメイン」に `aicoding-lab.com` を追加して保存。

![ドメイン追加後](/images/claude-code-routines/07-cloud-env-custom.png)

これで再実行するとアクセスできるようになりました。

## Claude のリンクチェックは誤検知が出た

ネットワーク問題を解決して再実行すると、今度は結果が返ってきました。しかし…

![誤検知の結果](/images/claude-code-routines/08-result-false-positive.png)

「壊れたリンクが2件」と報告されました。

- `https://git-scm.com/downloads/win` → URLのスペルミスの疑い
- `https://claude.com/ja/pricing` → 日本語ローカライズ版が存在しない可能性

実際にブラウザで確認したところ、**どちらも正常にアクセスできました**。

`git-scm.com/downloads/win` は別のURLにリダイレクトされるだけで生きているリンクです。`claude.com/ja/pricing` は日本語の料金ページとして存在しています。

**Claude がリダイレクト（3xx）を「壊れてる疑い」として報告してしまう**のが原因でした。

## 専用ツールに切り替えて解決

Claude 自身にリンクチェックをさせるのではなく、**専用ツールに実行させて結果だけ報告させる**方針に変えました。

使うのは `broken-link-checker` という npm パッケージ。Claude の「判断」を挟まずにツールの結果をそのまま返すので、誤検知が出にくくなります。

指示をこのように書き直しました。

![改善後の指示](/images/claude-code-routines/10-instruction-with-tool.png)

```
以下のコマンドを実行して aicoding-lab.com のリンク切れをチェックしてください：

npx broken-link-checker https://aicoding-lab.com --recursive --ordered

実行結果をもとに、以下の形式で日本語で報告してください：

- 調査したリンク総数
- 壊れたリンクがあれば「発見したページ」「リンク先URL」「エラー内容」を表形式で
- 壊れたリンクがなければ「リンク切れなし」と一言

※ 3xx（リダイレクト）は正常とみなし、4xx・5xxのみを「壊れたリンク」として報告してください。
```

ついでに指示を日本語化して、結果も日本語で返ってくるようにしました。

![日本語化後の指示確認画面](/images/claude-code-routines/09-instruction-japanese.png)

再実行するとこうなりました。

![最終結果（リンク切れ0件）](/images/claude-code-routines/11-result-clean.png)

```
調査したリンク総数：396件
壊れたリンク（4xx/5xx）：0件

リンク切れなし ✅
```

誤検知なし、スッキリした結果が返ってきました。

## まとめ

| ポイント | 内容 |
|---------|------|
| **Routines はクラウドで動く** | PC を閉じていても自動実行される |
| **Default 環境は外部ドメインをブロック** | カスタム設定で許可ドメインを追加する必要がある |
| **Claude に判断させると誤検知が出る** | 専用ツールに実行させて結果だけ報告させると精度が上がる |

Routines は現在リサーチプレビュー段階ですが、「定期的にやらなきゃいけない面倒な作業」を自動化するのに便利な機能です。リンクチェック以外にも、週次のネタ出しや GSC データのまとめなど、色々使えそうです。

### 関連記事

- 📖 [MCP とは？Claude Code を外部ツールに繋げる仕組み](/blog/what-is-mcp/)
- 🔍 [Brave Search MCPの使い方と検索結果を確認してみた](/blog/brave-search-mcp/)
- 🛠️ [Claude Code を入れたら最初に試す便利コマンド5選](/blog/claude-code-first-commands/)

---

このブログでは、Claude Code の使い方を**実際に試した体験ベース**で発信しています。お気に入り登録お願いします 🙌
