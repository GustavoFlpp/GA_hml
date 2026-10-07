import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..', '..');
const CONTEXT_LIMITS = {
  'ai/PROJECT_BRAIN.md': { limit: 300, required: true },
  'ai/AGENT_INSTRUCTIONS.md': { limit: 200, required: false },
  'ai/TASK_TEMPLATE.md': { limit: 180, required: false },
};

let failed = false;

for (const [relativePath, { limit, required }] of Object.entries(CONTEXT_LIMITS)) {
  const filePath = resolve(projectRoot, relativePath);

  if (!existsSync(filePath)) {
    const status = required ? 'FAIL (missing)' : 'OK (optional missing)';
    console.log(`context/${relativePath}: 0/${limit} lines — ${status}`);
    failed ||= required;
    continue;
  }

  const content = readFileSync(filePath, 'utf8');
  const lines = content === '' ? 0 : content.split(/\r?\n/).length - Number(content.endsWith('\n'));
  const ok = lines <= limit;
  console.log(`context/${relativePath}: ${lines}/${limit} lines — ${ok ? 'OK' : 'FAIL'}`);
  failed ||= !ok;
}

if (failed) {
  console.error('Compact current context and move historical details to docs/development.');
  process.exitCode = 1;
}
