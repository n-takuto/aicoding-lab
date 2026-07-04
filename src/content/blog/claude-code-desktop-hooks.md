---
title: 'Claude Codeデスクトップ版でHookを設定する方法'
description: 'Claude Codeのデスクトップ版でHook（フック）を設定する手順を、実際にハマった失敗談つきで解説します。/hooksコマンドが使えない問題、.cjsが必要な理由、画面に通知が出ないときの対処法まで、初心者向けにステップごとにまとめました。'
category: 'tips'
pubDate: '2026-06-21T20:00:00'
updatedDate: '2026-07-04T21:00:00'
---

このブログは Claude Code に手伝ってもらいながら書いているのですが、ひとつ困ったクセがありました。**記事を書いたあと、事実チェック（検証）の工程をついスキップしてしまう**んです。

そこで「記事を編集したら検証を促してくれる」仕組みを、Claude Code の **Hook（フック）** で作ってみることにしました。

ところがデスクトップ版だと、解説記事でよく出てくる手順がそのまま使えず、4回も再起動するハメに……。この記事では、私が実際にハマったポイントと解決策を、つまずいた順にまとめます。同じくデスクトップ版を使っている方の時短になればうれしいです。

## Hook（フック）とは？

Hook とは、**「○○したら、自動で△△する」というルールを Claude Code に仕込む機能**です。

たとえば：
- ファイルを保存したら → 自動でコード整形
- 危険なコマンドを実行しようとしたら → ブロック
- ファイルを編集したら → 「テストを忘れずに」とリマインド

今回やりたかったのは最後のパターン。「記事ファイルを編集したら、検証を促すメッセージを出す」という自動化です。

## デスクトップ版では `/hooks` が使えない

多くの解説記事では「`/hooks` コマンドで設定画面を開く」と書かれています。でも、これは**ターミナルから使う CLI 版だけの機能**です。

デスクトップ版（アプリ）で `/hooks` を実行すると、こう表示されます。

```
/hooks isn't available in this environment.
```

`/permissions` や `/config` なども同じで、デスクトップ版では使えません。

つまり、**デスクトップ版で Hook を設定するには `settings.json` を直接編集するしかない**、というのが結論です。これが分かるまでが第一の関門でした。

## 実際の設定方法

設定は2つのファイルで行います。

**① `.claude/settings.json` にルールを書く**<br>
プロジェクトのルートにある `.claude/settings.json` に、Hook の設定を追記します。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/verify-reminder.cjs"
          }
        ]
      }
    ]
  }
}
```

ざっくり説明すると：
- `PostToolUse`：ツールを使った**後**に実行する、という意味
- `matcher`：どのツールに反応するか（ここでは編集系の `Edit` と `Write`）
- `command`：実行するスクリプト

**② スクリプト本体を作る**<br>
`.claude/hooks/verify-reminder.cjs` に、実際の処理を書きます。

```js
const path = require('path');
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('src/content/blog/') && normalized.endsWith('.md')) {
      process.stderr.write('⚠️ 記事を編集しました。検証を忘れずに！');
      process.exit(2);
    }
  } catch (e) {}
  process.exit(0);
});
```

「編集したのがブログ記事（`src/content/blog/` 内の `.md`）なら、リマインドを出す」という内容です。

## ハマりポイント①：拡張子は `.cjs` にする

最初、このスクリプトを `.js` で保存したら**まったく動きませんでした**。エラーすら出ず、ただ無反応。

原因は、プロジェクトの設定ファイル `package.json` に書かれた以下の一行でした。

```json
"type": "module"
```

これがあると、`.js` ファイルは「ES Modules」という新しい書き方として扱われます。でも私のスクリプトは `require()` という**古い書き方（CommonJS）**で書いていたため、起動した瞬間にエラーで止まっていたのです。

解決策は、拡張子を **`.cjs`** にすること。これで「絶対に CommonJS として扱え」と強制でき、`require()` が使えるようになります。

※ Astro や多くのモダンな JavaScript プロジェクトには `"type": "module"` が入っているので、Hook スクリプトは最初から `.cjs` で作るのが安全です。

## ハマりポイント②：画面に通知が出ない

次にハマったのが「通知の出し方」です。

公式情報を見ると `systemMessage` というフィールドでユーザーに警告を出せると書かれていました。ところが、デスクトップ版では**この通知が画面にまったく表示されませんでした**（2026年6月21日時点）。

そこで方針を変えて、**`exit code 2` + 標準エラー出力（stderr）** を使う方法に切り替えました。

```js
process.stderr.write('⚠️ 記事を編集しました。検証を忘れずに！');
process.exit(2);
```

こうすると、メッセージが Claude Code 側に届くようになります。今回やりたかったのは「記事を書いたあと、検証の工程に進むよう Claude Code に念押しする」ことだったので、画面通知よりこの方法の方がむしろ目的にぴったりでした。

なお、この「`exit 2` と stderr を組み合わせるとなぜ Claude に通知が届くのか」という仕組みは、[Hookのexit 2とstderrを基礎から解説](/blog/claude-code-hook-exit-code-stderr/)の記事で、料理の例えを使ってもっと詳しく説明しています。仕組みから理解したい方はあわせてどうぞ。

## ハマりポイント③：上位モデルに切り替えたら一発で解決

実はこのトラブル、最初は Claude Code のモデルを **Sonnet 4.6（当時の標準モデル。2026年7月4日現在はSonnet 5が最新）** にして進めていました。でもなかなか原因にたどり着けず、設定をあれこれ変えては試す、を繰り返すループにハマっていました。正直、ここが一番しんどかったです。

転機は、思い切って上位モデルの **Opus 4.8** に切り替えたことでした。

すると今度は、いきなり「まずはターミナルでスクリプトを単体テストして切り分けましょう」と提案してきたんです。

```bash
echo '{"tool_input":{"file_path":"test.md"}}' | node .claude/hooks/verify-reminder.cjs
```

こんなふうに疑似的なデータをスクリプトに流し込めば、アプリを動かさなくてもその場で動作確認できます。この一発で `"type": "module"` が原因だとあっさり特定。さんざん再起動を繰り返していた私からすると、その切り分けの賢さにちょっと感動しました。

Claude Code は使う AI モデルを選べます（`/model` コマンドで切り替え）。速さ重視の Sonnet、賢さ重視の Opus、という住み分けです。普段は Sonnet で十分ですが、**原因が分からず行き詰まったときは、上位モデルに切り替えてみる**のも有効な一手だなと実感しました。

なお、`.claude/settings.json` の変更は再起動なしで自動反映されるので、設定をいじるたびにアプリを再起動する必要はありません。

## まとめ

- デスクトップ版では `/hooks` コマンドは使えない → `settings.json` を直接編集する
- Hook スクリプトは **`.cjs`** で作る（`"type": "module"` 対策）
- 画面通知（`systemMessage`）が出ないときは **`exit 2` + stderr** を使う
- `settings.json` の変更は**自動反映**（再起動不要）
- 動作確認は**ターミナルで単体テスト**するのが最速
- 原因が分からず詰まったら、**上位モデル（Opus）に切り替える**のも手

ネット上には「デスクトップ版では Hook が動かない」という情報も見かけますが、上記のポイントを押さえれば**ちゃんと動きます**。同じところで悩んでいる方の参考になればうれしいです。

---

### 📖 関連記事

- [Claude Codeとは？できることと始め方](/blog/what-is-claude-code/)
- [Claude Codeデスクトップ版インストール手順【Win/Mac】](/blog/claude-code-desktop-install/)
- [CLAUDE.mdの書き方と育て方【実運用ガイド】](/blog/claude-md-guide/)
