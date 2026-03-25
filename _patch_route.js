const fs = require('fs');
const p = '/var/www/i_am_running/app/api/dev-agent/route.ts';
let c = fs.readFileSync(p, 'utf-8');

const OLD_SIG = "async function loadContextCore(): Promise<string> {\n  try {\n    const files = await readdir(CONTEXT_CORE_DIR);\n    const mdFiles = files.filter(f => f.endsWith('.md')).sort();";
const NEW_SIG = "async function loadContextCore(clientSlug?: string): Promise<string> {\n  try {\n    const dir = clientSlug\n      ? `/var/www/iam-clients/${clientSlug}/context-core`\n      : CONTEXT_CORE_DIR;\n    const files = await readdir(dir);\n    const mdFiles = files.filter(f => f.endsWith('.md')).sort();";

if (!c.includes(OLD_SIG)) { console.error('SIG not found'); process.exit(1); }
c = c.replace(OLD_SIG, NEW_SIG);

const OLD_JOIN = "const content = await readFile(join(CONTEXT_CORE_DIR, file), 'utf-8');";
const NEW_JOIN = "const content = await readFile(join(dir, file), 'utf-8');";
if (!c.includes(OLD_JOIN)) { console.error('JOIN not found'); process.exit(1); }
c = c.replace(OLD_JOIN, NEW_JOIN);

fs.writeFileSync(p, c, 'utf-8');
console.log('OK: both patches applied');
