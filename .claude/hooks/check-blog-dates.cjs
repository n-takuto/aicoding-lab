const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    const content = fs.readFileSync(filePath, 'utf8');
    const pubDate = extractField(content, 'pubDate');
    const updatedDate = extractField(content, 'updatedDate');

    if (!pubDate) {
      process.exit(0); // frontmatterがまだ書きかけ等。何もしない
    }

    const today = todayStr();
    const pubDateDay = pubDate.slice(0, 10);

    const tracked = isTracked(relPath);

    if (!tracked) {
      // 新規記事：pubDateは今日でなければならない
      if (pubDateDay !== today) {
        process.stderr.write(
          `⚠️ 新しい記事のpubDateが今日の日付と一致していません。\n` +
          `  記事内のpubDate: ${pubDateDay}\n` +
          `  今日の日付　　: ${today}\n` +
          `  pubDateを今日の日付（${today}）に修正してください。`
        );
        process.exit(2);
      }
      process.exit(0);
    }

    // 既存記事の修正：pubDateは変更禁止、updatedDateは今日にすべき
    const headPubDate = getHeadPubDate(relPath);
    if (headPubDate && headPubDate !== pubDate) {
      process.stderr.write(
        `⚠️ 既存記事のpubDateを変更しようとしています。\n` +
        `  変更前: ${headPubDate}\n` +
        `  変更後: ${pubDate}\n` +
        `  pubDateは初出公開日なので変更しないでください。日付を直したいだけならpubDateは元に戻し、updatedDateを今日の日付にしてください。`
      );
      process.exit(2);
    }

    const updatedDateDay = updatedDate ? updatedDate.slice(0, 10) : null;
    if (updatedDateDay !== today) {
      // ブロックはしない。非ブロッキングでリマインドだけ行う
      process.stdout.write(
        `💡 既存記事を修正しました。updatedDateを今日の日付（${today}）に更新することを検討してください` +
        (updatedDate ? `（現在: ${updatedDate}）。` : '（現在未設定）。')
      );
      process.exit(0);
    }

    process.exit(0);
  } catch (e) {
    process.exit(0); // 想定外のエラーではブロックしない
  }
});

function extractField(content, field) {
  const re = new RegExp(field + ":\\s*'([^']+)'");
  const m = content.match(re);
  return m ? m[1] : null;
}

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isTracked(relPath) {
  try {
    execSync(`git ls-files --error-unmatch "${relPath}"`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function getHeadPubDate(relPath) {
  try {
    const headContent = execSync(`git show HEAD:"${relPath}"`, { encoding: 'utf8' });
    return extractField(headContent, 'pubDate');
  } catch (e) {
    return null;
  }
}
