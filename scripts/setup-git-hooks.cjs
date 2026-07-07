const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

for (const hook of ['.githooks/pre-commit', '.githooks/pre-push']) {
  if (fs.existsSync(hook)) {
    fs.chmodSync(hook, 0o755);
  }
}

if (!fs.existsSync('.git')) {
  process.exit(0);
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    stdio: 'ignore',
  });
} catch {
  console.warn(
    'Could not configure Git hooks automatically; run: git config core.hooksPath .githooks',
  );
}
