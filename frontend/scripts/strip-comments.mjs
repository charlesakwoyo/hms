import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src'];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs']);

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : files(full);
    return extensions.has(path.extname(entry.name)) || entry.name.endsWith('.css') ? [full] : [];
  });
}

function commentRanges(text, source) {
  const ranges = new Map();
  const add = (list) => (list || []).forEach((r) => ranges.set(r.pos, r.end));
  const visit = (node) => {
    add(ts.getLeadingCommentRanges(text, node.pos));
    add(ts.getTrailingCommentRanges(text, node.end));
    ts.forEachChild(node, visit);
  };
  visit(source);
  add(ts.getLeadingCommentRanges(text, source.endOfFileToken.pos));
  return [...ranges.entries()].map(([pos, end]) => ({ pos, end }));
}

function emptyJsxExpressions(source) {
  const found = [];
  const visit = (node) => {
    if (ts.isJsxExpression(node) && !node.expression) found.push({ pos: node.getStart(source), end: node.end });
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function removeRanges(text, ranges) {
  const sorted = [...ranges].sort((a, b) => b.pos - a.pos);
  let out = text;
  let last = Infinity;
  for (const r of sorted) {
    if (r.end > last) continue;
    out = out.slice(0, r.pos) + out.slice(r.end);
    last = r.pos;
  }
  return out;
}

function tidy(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

function stripScript(file) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  let text = fs.readFileSync(file, 'utf8');
  let source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  text = removeRanges(text, commentRanges(text, source));
  source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  text = removeRanges(text, emptyJsxExpressions(source));
  return tidy(text);
}

function stripCss(file) {
  return tidy(fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''));
}

let changed = 0;
for (const root of roots) {
  for (const file of files(root)) {
    const before = fs.readFileSync(file, 'utf8');
    const after = file.endsWith('.css') ? stripCss(file) : stripScript(file);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed += 1;
    }
  }
}
console.log(`Comments removed from ${changed} file(s).`);
