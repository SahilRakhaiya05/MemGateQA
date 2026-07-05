import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && f !== 'node_modules') walk(p, acc);
    else if (/\.tsx$/.test(f)) acc.push(p);
  }
  return acc;
}

function readAllCss(dir) {
  let acc = '';
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && f !== 'node_modules') acc += readAllCss(p);
    else if (f.endsWith('.css')) acc += fs.readFileSync(p, 'utf8');
  }
  return acc;
}
const css = readAllCss('src');
const defined = new Set([...css.matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]));

const used = new Map();
for (const file of walk('src')) {
  const txt = fs.readFileSync(file, 'utf8');
  for (const m of txt.matchAll(/className\s*=\s*"([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) add(c, file);
  }
  for (const m of txt.matchAll(/className\s*=\s*\{`([^`]+)`\}/g)) {
    for (const c of m[1].split(/\s+/)) add(c.replace(/\$\{[^}]+\}/g, '').trim(), file);
  }
  for (const m of txt.matchAll(/className\s*=\s*\{['"]([^'"]+)['"]\}/g)) {
    for (const c of m[1].split(/\s+/)) add(c, file);
  }
}

function add(c, file) {
  if (!c || !/^[a-z][\w-]*$/.test(c)) return;
  if (!used.has(c)) used.set(c, new Set());
  used.get(c).add(file);
}

const tailwind = /^(text|bg|flex|grid|min|max|p-|px-|py-|pt-|pb-|pl-|pr-|m-|mx-|my-|mt-|mb-|ml-|mr-|w-|h-|gap-|rounded|border|font|items|justify|hidden|block|relative|absolute|fixed|overflow|opacity|z-|top-|left-|right-|bottom|space|leading|tracking|uppercase|lowercase|truncate|whitespace|cursor|pointer|transition|duration|ease|animate|hover|focus|active|disabled|lg:|md:|sm:|xl:|2xl:|group|sr-only|inline|col|row|self|place|object|aspect|ring|shadow|divide|from|to|via|not|list|table|align|break|box|clear|float|isolate|mix|outline|resize|scroll|snap|touch|underline|decoration|indent|content|fill|stroke|visible|invisible|collapse|origin|scale|rotate|translate|skew|transform|filter|backdrop|appearance|accent|caret|columns|container|basis|grow|shrink|order|line|antialiased|italic|bold|medium|semibold|light|thin|extrabold|normal|prose|inset|size|supports|print|dark|wrap|nowrap|contents|static|sticky|no-underline)/;

const missing = [...used.keys()]
  .filter((c) => !defined.has(c) && !tailwind.test(c))
  .sort();

console.log('Genuinely missing custom classes:', missing.length);
for (const c of missing) {
  const files = [...used.get(c)].map((f) => path.basename(f)).join(', ');
  console.log(`  .${c}  (${files})`);
}