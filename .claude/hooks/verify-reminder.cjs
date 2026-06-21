const fs = require('fs');
const path = require('path');
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.includes('src/content/blog/') && normalized.endsWith('.md')) {
      process.stderr.write('⚠️ 記事ファイル(' + path.basename(normalized) + ')を編集しました。push前に /verify-article で検証エージェント（事実・文体・SEO）を必ず走らせてください。');
      process.exit(2);
    }
  } catch (e) {}
  process.exit(0);
});
