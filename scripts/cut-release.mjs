// Automates the Jira side of "cut a release": tags the given issues with a
// Fix Version (creating it if it doesn't exist), transitions each issue to
// Released, and marks the Version released. Modelled on the Music Ledger's
// script of the same name, but with no dependencies: this site has no build
// step and no package.json, so it uses Node's built-in fetch and reads .env
// itself. Deliberately does NOT merge, tag or push - see
// docs/release-process.md for the full checklist this is one step of.
//
// Usage:   node scripts/cut-release.mjs <version> <ISSUE-1> [ISSUE-2 ...]
// Example: node scripts/cut-release.mjs 0.1.0 RVB-1 RVB-2
// Check:   node scripts/cut-release.mjs --check   (reads only; changes nothing)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal .env reader: KEY=value lines, # comments, optional quotes.
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv(path.join(__dirname, '..', '.env'));

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY } = process.env;

if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
  console.error('Missing Jira config. Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN and JIRA_PROJECT_KEY in .env (see .env.example).');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function jira(method, apiPath, body) {
  const res = await fetch(`${JIRA_BASE_URL}${apiPath}`, {
    method,
    headers: { Authorization: authHeader, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${apiPath} -> ${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

const listVersions = () => jira('GET', `/rest/api/3/project/${JIRA_PROJECT_KEY}/versions`);

async function check() {
  const me = await jira('GET', '/rest/api/3/myself');
  const versions = await listVersions();
  console.log(`Signed in to ${JIRA_BASE_URL} as ${me.displayName}.`);
  console.log(`Project ${JIRA_PROJECT_KEY} has ${versions.length} version(s)${versions.length ? ': ' + versions.map((v) => `${v.name}${v.released ? ' (released)' : ''}`).join(', ') : ''}.`);
  console.log('Nothing was changed.');
}

async function findOrCreateVersion(version) {
  const existing = (await listVersions()).find((v) => v.name === version);
  if (existing) return existing;
  return jira('POST', '/rest/api/3/version', { name: version, project: JIRA_PROJECT_KEY });
}

async function transitionToReleased(issueKey) {
  const { transitions } = await jira('GET', `/rest/api/3/issue/${issueKey}/transitions`);
  const released = transitions.find((t) => t.name === 'Released');
  if (!released) {
    console.warn(`  (no "Released" transition available for ${issueKey} right now - left as-is)`);
    return;
  }
  await jira('POST', `/rest/api/3/issue/${issueKey}/transitions`, { transition: { id: released.id } });
}

async function main() {
  const [, , version, ...issueKeys] = process.argv;

  if (version === '--check') return check();

  if (!version || issueKeys.length === 0) {
    console.error('Usage:   node scripts/cut-release.mjs <version> <ISSUE-1> [ISSUE-2 ...]');
    console.error('Example: node scripts/cut-release.mjs 0.1.0 RVB-1 RVB-2');
    console.error('Check:   node scripts/cut-release.mjs --check');
    process.exit(1);
  }
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`"${version}" is not an X.Y.Z version number.`);
    process.exit(1);
  }
  const wrongProject = issueKeys.filter((k) => !k.startsWith(`${JIRA_PROJECT_KEY}-`));
  if (wrongProject.length) {
    console.error(`These are not ${JIRA_PROJECT_KEY} issues: ${wrongProject.join(', ')}`);
    process.exit(1);
  }

  console.log(`Cutting release ${version} for: ${issueKeys.join(', ')}`);

  const ver = await findOrCreateVersion(version);
  console.log(`Using Jira Version "${ver.name}" (id ${ver.id})`);

  for (const key of issueKeys) {
    console.log(`Tagging ${key} with Fix Version ${version}...`);
    await jira('PUT', `/rest/api/3/issue/${key}`, { fields: { fixVersions: [{ name: version }] } });
    console.log(`Transitioning ${key} to Released...`);
    await transitionToReleased(key);
  }

  console.log('Marking the Jira Version released...');
  await jira('PUT', `/rest/api/3/version/${ver.id}`, { released: true, releaseDate: new Date().toISOString().slice(0, 10) });

  console.log('');
  console.log('Done. Remaining steps are in docs/release-process.md (tag the release, bring sandbox level with main).');
}

main().catch((err) => {
  console.error('cut-release failed:', err.message);
  process.exit(1);
});
