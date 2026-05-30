#!/usr/bin/env node
/**
 * module-health.js — Signal Circuit module-health/boundary report.
 *
 * Day 86 (2026-05-24) — Module Split Foundation.
 *
 * Pure Node, no npm deps. Scans js/*.js, finds top-level declarations,
 * cross-references identifier usage across files, and emits a markdown
 * report at specs/module-health.md.
 *
 * Metrics per file:
 *   - LOC (lines including blank/comments)
 *   - Globals defined (classes, functions, top-level const/let/var)
 *   - Classes exposed (subset of globals defined)
 *   - Fan-out: distinct other-file globals referenced from this file
 *   - Fan-in:  distinct globals defined here that other files reference
 *
 * Per-symbol table: which other files reference each global definition.
 *
 * Limitations (called out intentionally):
 *   - Pure regex parsing — does not understand string literals or comments,
 *     so a symbol mentioned in a comment is still counted. This is the
 *     conservative direction (over-counts coupling, never under-counts),
 *     and is fine for a coupling-trend metric.
 *   - Only top-of-line declarations (anchored at ^) are treated as
 *     exposed globals. Nested helpers and IIFE-scoped symbols are
 *     correctly ignored.
 *   - "Reference" = whole-word occurrence of the symbol anywhere in
 *     another file's source.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const OUT = path.join(ROOT, 'specs', 'module-health.md');

const FILES = fs
  .readdirSync(JS_DIR)
  .filter((n) => n.endsWith('.js'))
  .sort();

// Read everything once.
const sources = {};
for (const name of FILES) {
  sources[name] = fs.readFileSync(path.join(JS_DIR, name), 'utf8');
}

// Top-of-line declaration: class|function|const|let|var followed by an ident,
// optionally prefixed with `export `. We anchor at line start so we only
// catch globals. The optional `export ` prefix supports ES-module files
// (Day 92+ — gates.js is the first ESM-converted module).
const DECL_RE = /^(?:export\s+)?(class|function|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;

// ESM detection: a file is an ES module if it has any top-level `export `
// (Day 92+ baseline). Day 86 baseline was zero ESM modules.
const ESM_RE = /^export\s+/m;

// Per-file declared globals.
const declsByFile = {}; // name -> { kind, lineIndex } per symbol
for (const name of FILES) {
  declsByFile[name] = {};
  const src = sources[name];
  let m;
  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(src)) !== null) {
    const [, kind, sym] = m;
    // Skip duplicates in the same file (e.g. `let` reassigned at top level).
    if (!declsByFile[name][sym]) {
      // Compute 1-based line index.
      const before = src.slice(0, m.index);
      const lineIdx = before.split('\n').length;
      declsByFile[name][sym] = { kind, line: lineIdx };
    }
  }
}

// Globals-by-symbol reverse index: which file defines each symbol?
const definedIn = {};
for (const file of FILES) {
  for (const sym of Object.keys(declsByFile[file])) {
    // First definer wins; collisions are reported below.
    if (!definedIn[sym]) definedIn[sym] = file;
  }
}

// Collisions: symbols declared in multiple files.
const collisions = [];
for (const file of FILES) {
  for (const sym of Object.keys(declsByFile[file])) {
    if (definedIn[sym] !== file) {
      collisions.push({ sym, files: [definedIn[sym], file] });
    }
  }
}

// For each (file, symbol), count whole-word references in other files.
// A symbol's "references_out" = files that mention it minus its own file.
const refCount = {}; // sym -> { fileName: count }
for (const sym of Object.keys(definedIn)) {
  const re = new RegExp(`\\b${escapeRegExp(sym)}\\b`, 'g');
  refCount[sym] = {};
  for (const otherFile of FILES) {
    if (otherFile === definedIn[sym]) continue;
    const matches = sources[otherFile].match(re);
    if (matches && matches.length > 0) {
      refCount[sym][otherFile] = matches.length;
    }
  }
}

// Per-file aggregates.
const perFile = {};
for (const file of FILES) {
  const src = sources[file];
  const loc = src.split('\n').length;
  const decls = declsByFile[file];
  const symbolNames = Object.keys(decls);
  const classes = symbolNames.filter((s) => decls[s].kind === 'class');

  // Fan-in: distinct symbols defined here that other files reference.
  const fanInSymbols = symbolNames.filter(
    (s) => Object.keys(refCount[s] || {}).length > 0,
  );
  const fanInFiles = new Set();
  for (const s of fanInSymbols) {
    for (const f of Object.keys(refCount[s])) fanInFiles.add(f);
  }

  // Fan-out: distinct other-file globals referenced from this file.
  const fanOutSymbols = [];
  const fanOutFiles = new Set();
  for (const sym of Object.keys(definedIn)) {
    if (definedIn[sym] === file) continue;
    const re = new RegExp(`\\b${escapeRegExp(sym)}\\b`, 'g');
    const matches = src.match(re);
    if (matches && matches.length > 0) {
      fanOutSymbols.push({ sym, defIn: definedIn[sym], count: matches.length });
      fanOutFiles.add(definedIn[sym]);
    }
  }

  perFile[file] = {
    loc,
    globalsDefined: symbolNames.length,
    classesExposed: classes,
    fanInSymbols,
    fanInFiles: [...fanInFiles].sort(),
    fanOutSymbols, // [{sym, defIn, count}]
    fanOutFiles: [...fanOutFiles].sort(),
    esm: ESM_RE.test(src), // Day 92+
  };
}

// ESM-converted count (Day 92 baseline: 1 of 10).
const esmCount = FILES.filter((f) => perFile[f].esm).length;

// Totals.
const totalLoc = FILES.reduce((s, f) => s + perFile[f].loc, 0);
const totalGlobals = FILES.reduce((s, f) => s + perFile[f].globalsDefined, 0);

// Pick biggest fan-out file by symbol count.
const biggestFanOutFile = [...FILES].sort(
  (a, b) =>
    perFile[b].fanOutSymbols.length - perFile[a].fanOutSymbols.length,
)[0];

// Render markdown.
let md = '';
md += '# Module Health Report — Signal Circuit\n\n';
md += `_Auto-generated by \`tools/module-health.js\` on ${new Date().toISOString()}._\n\n`;
md += '> Pure regex-based coupling report for the non-module `js/*.js`\n';
md += "> sources. See `tools/module-health.js` header for methodology and\n";
md += '> limitations. Rerunnable: `node tools/module-health.js`.\n\n';

md += '## Summary\n\n';
md += `- **Files scanned:** ${FILES.length}\n`;
md += `- **Total LOC:** ${totalLoc}\n`;
md += `- **Total top-level globals declared:** ${totalGlobals}\n`;
md += `- **Biggest fan-out file:** \`${biggestFanOutFile}\` (` +
  `${perFile[biggestFanOutFile].fanOutSymbols.length} distinct cross-file ` +
  `globals referenced, across ${perFile[biggestFanOutFile].fanOutFiles.length} files)\n`;
md += `- **Cross-file symbol collisions:** ${collisions.length}\n`;
md += `- **ES-module-converted files:** ${esmCount} of ${FILES.length}` +
  (esmCount > 0 ? ` (${FILES.filter((f) => perFile[f].esm).map((f) => `\`${f}\``).join(', ')})` : '') +
  '\n\n';

md += '## Per-file metrics\n\n';
md += '| File | LOC | Globals | Classes | ESM | Fan-in syms | Fan-in files | Fan-out syms | Fan-out files |\n';
md += '|------|----:|--------:|--------:|:---:|------------:|-------------:|-------------:|--------------:|\n';
for (const file of FILES) {
  const m = perFile[file];
  md += `| \`${file}\` | ${m.loc} | ${m.globalsDefined} | ${m.classesExposed.length} | ${m.esm ? '✅' : '—'} | ${m.fanInSymbols.length} | ${m.fanInFiles.length} | ${m.fanOutSymbols.length} | ${m.fanOutFiles.length} |\n`;
}
md += '\n';

md += '## Fan-in detail — who references each file\n\n';
md += 'A file with high fan-in defines symbols that the rest of the codebase\n';
md += 'depends on. Higher fan-in = riskier to move.\n\n';
for (const file of FILES) {
  const m = perFile[file];
  md += `### \`${file}\`\n\n`;
  if (m.fanInSymbols.length === 0) {
    md += '_No globals from this file are referenced by other files._\n\n';
    continue;
  }
  md += '| Symbol | Kind | Referenced by | Total refs |\n';
  md += '|--------|------|---------------|----------:|\n';
  for (const sym of m.fanInSymbols.sort()) {
    const decls = declsByFile[file];
    const refs = refCount[sym] || {};
    const files = Object.keys(refs).sort();
    const total = files.reduce((s, f) => s + refs[f], 0);
    md += `| \`${sym}\` | ${decls[sym].kind} | ${files.map((f) => `\`${f}\``).join(', ')} | ${total} |\n`;
  }
  md += '\n';
}

md += '## Fan-out detail — what each file pulls in\n\n';
md += 'A file with high fan-out reaches into the rest of the codebase.\n';
md += 'Higher fan-out = more imports to disentangle when extracting a\n';
md += 'module.\n\n';
for (const file of FILES) {
  const m = perFile[file];
  md += `### \`${file}\`\n\n`;
  if (m.fanOutSymbols.length === 0) {
    md += '_This file does not reference any cross-file globals._\n\n';
    continue;
  }
  md += '| Symbol | Defined in | Refs from this file |\n';
  md += '|--------|------------|---------------------:|\n';
  const sorted = [...m.fanOutSymbols].sort(
    (a, b) => b.count - a.count || a.sym.localeCompare(b.sym),
  );
  for (const row of sorted) {
    md += `| \`${row.sym}\` | \`${row.defIn}\` | ${row.count} |\n`;
  }
  md += '\n';
}

if (collisions.length > 0) {
  md += '## Cross-file symbol collisions\n\n';
  md += '| Symbol | Defined in (first) | Also declared in |\n';
  md += '|--------|--------------------|------------------|\n';
  for (const c of collisions) {
    md += `| \`${c.sym}\` | \`${c.files[0]}\` | \`${c.files[1]}\` |\n`;
  }
  md += '\n';
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);

// Also emit a one-line summary to stdout so CI/heartbeats can grep it.
console.log(
  `module-health: ${FILES.length} files, ${totalLoc} LOC, ${totalGlobals} globals, ` +
    `biggest fan-out=${biggestFanOutFile} (${perFile[biggestFanOutFile].fanOutSymbols.length} syms), ` +
    `collisions=${collisions.length}, ESM=${esmCount}/${FILES.length}. ` +
    `Wrote ${path.relative(ROOT, OUT)}.`,
);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
