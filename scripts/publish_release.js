#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 mlurker@gmail.com
// Publishes the packages in dist/ as the GitHub release "catalog" of this repository, the layout the mgu Store
// reads (catalog.json, schema 2: docs/PUBLISHING.md of robertnisipeanu/mgu-store, "Catalog").
// Usage: node scripts/publish_release.js [--repo <owner>/<repo>] [--dry-run]
// Each tools/<id>/component.json with a dist/<id>@<version>.tgz is listed. Older packages already on the release
// stay attached (unlisted), so an older catalog can be put back.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const ri = args.indexOf('--repo');
const REPO = ri >= 0 ? args[ri + 1] : 'mlurker/bmw-idrive7-apps';
if (!/^[\w.-]+\/[\w.-]+$/.test(REPO)) { throw new Error('--repo needs <owner>/<repo>'); }
const gh = (a, o) => (cp.execFileSync('gh', a, Object.assign({ encoding: 'utf8' }, o)) || '').trim();
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

const isPrivate = gh(['api', `repos/${REPO}`, '-q', '.private']) === 'true';
if (isPrivate) { throw new Error(`${REPO} is private: the Store would need a token; make it public or use another repo`); }

const upload = [];
const components = fs.readdirSync(path.join(ROOT, 'tools')).filter((id) => fs.existsSync(path.join(ROOT, 'tools', id, 'component.json'))).map((id) => {
    const dir = path.join(ROOT, 'tools', id);
    const c = JSON.parse(fs.readFileSync(path.join(dir, 'component.json'), 'utf8'));
    const tgz = path.join(DIST, `${id}@${c.version}.tgz`);
    if (!fs.existsSync(tgz)) { throw new Error(`missing ${path.relative(ROOT, tgz)}`); }
    const name = path.basename(tgz);
    const url = (n) => `https://github.com/${REPO}/releases/download/catalog/${n}`;
    upload.push(tgz);
    const e = { id, kind: 'tool', title: c.title, description: c.description, version: c.version,
        artifact: { name, size: fs.statSync(tgz).size, sha256: sha(tgz), url: url(name) } };
    if (c.requires) { e.requires = c.requires; }
    e.uninstallable = c.uninstallable !== false;
    e.mguHmi = c.mguHmi;
    const png = path.join(dir, 'icon.png');
    if (fs.existsSync(png)) { e.icon = `${id}.png`; e.iconSha256 = sha(png); upload.push({ from: png, as: e.icon }); }
    return e;
});

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'catalog-'));
const files = upload.map((u) => {
    if (typeof u === 'string') { return u; }
    const dst = path.join(tmp, u.as); fs.copyFileSync(u.from, dst); return dst;
});
const catalog = path.join(tmp, 'catalog.json');
fs.writeFileSync(catalog, JSON.stringify({ schema: 2, components }, null, 2) + '\n');

console.log(`${DRY ? '[dry run] ' : ''}${REPO}: ${components.map((c) => `${c.id}@${c.version}`).join(', ')}; uploads ${files.map((f) => path.basename(f)).join(', ')}, then catalog.json`);
if (DRY) { console.log(fs.readFileSync(catalog, 'utf8')); process.exit(0); }
try { gh(['release', 'view', 'catalog', '--repo', REPO]); } catch (e) {
    gh(['release', 'create', 'catalog', '--repo', REPO, '--title', 'catalog', '--notes', 'mgu Store catalog (scripts/publish_release.js)']);
}
gh(['release', 'upload', 'catalog', '--repo', REPO, '--clobber'].concat(files), { stdio: 'inherit' });
gh(['release', 'upload', 'catalog', '--repo', REPO, '--clobber', catalog], { stdio: 'inherit' });
console.log(`published: https://github.com/${REPO}/releases/tag/catalog`);
