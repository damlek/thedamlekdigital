// End-to-end: email -> Supabase lookup -> written content -> branded HTML ->
// PDF. This is the single entry point the skill instructions call.
//
// Usage: node generate-report.mjs --email someone@example.com [--out-dir path]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const email = getArg('email');
if (!email) {
  console.error('Usage: node generate-report.mjs --email someone@example.com [--out-dir path]');
  process.exit(1);
}

const outDir = getArg('out-dir') || process.cwd();
fs.mkdirSync(outDir, { recursive: true });

function run(script, args) {
  return execFileSync('node', [path.join(__dirname, script), ...args], { encoding: 'utf8' });
}

// 1. Fetch + resolve the submission from Supabase.
const submissionJson = run('fetch-submission.mjs', ['--email', email]);
const submission = JSON.parse(submissionJson);

const slug = (submission.businessName || submission.name || 'prospect')
  .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'prospect';

const contentPath = path.join(outDir, `${slug}-content.json`);
const htmlPath = path.join(outDir, `${slug}-readiness-report.html`);
const pdfPath = path.join(outDir, `${slug}-readiness-report.pdf`);

// 2. Write the recommendation content (evidence + fixes + roadmap).
fs.writeFileSync(path.join(outDir, `${slug}-submission.json`), submissionJson);
run('generate-content.mjs', ['--in', path.join(outDir, `${slug}-submission.json`), '--out', contentPath]);

// 3. Render the branded HTML report.
run('build-report.mjs', ['--in', contentPath, '--out', htmlPath]);

// 4. Render the HTML to PDF.
run('render-pdf.mjs', ['--in', htmlPath, '--out', pdfPath]);

if (submission.otherSubmissionsCount > 0) {
  console.error(
    `Note: ${email} has ${submission.otherSubmissionsCount} older submission(s) on file — this report uses the most recent one (${submission.submittedAt}).`
  );
}

console.log(pdfPath);
