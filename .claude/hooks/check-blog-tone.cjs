const fs = require('fs');

const NG_PATTERNS = [
  { pattern: /することができます/, label: '〜することができます' },
  { pattern: /と言えるでしょう/, label: '〜と言えるでしょう' },
  { pattern: /本稿では/, label: '本稿では' },
  { pattern: /ご利用ください/, label: 'ご利用ください' },
  { pattern: /ご確認ください/, label: 'ご確認ください' },
  { pattern: /正直に書きます/, label: '正直に書きます' },
  { pattern: /正直に言うと/, label: '正直に言うと' },
  { pattern: /わけです/, label: '〜わけです（説明口調）' },
  { pattern: /なるほど、?と思いました/, label: 'なるほど、と思いました（内面リアクション）' },
  { pattern: /TL;?DR/i, label: 'TL;DR' },
  { pattern: /\bIMO\b/, label: 'IMO' },
  { pattern: /\bFYI\b/, label: 'FYI' },
];

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    const normalized = filePath.replace(/\\/g, '/');

    if (!normalized.includes('src/content/blog/') || !normalized.endsWith('.md')) {
      process.exit(0);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const hits = NG_PATTERNS.filter(({ pattern }) => pattern.test(content)).map(({ label }) => label);

    if (hits.length > 0) {
      process.stderr.write(
        `💬 CLAUDE.mdのNG表現っぽいフレーズが見つかりました。書き直しを検討してください。\n` +
        hits.map(h => `  - ${h}`).join('\n')
      );
      process.exit(2);
    }

    process.exit(0);
  } catch (e) {
    process.exit(0); // 想定外のエラーではブロックしない
  }
});
