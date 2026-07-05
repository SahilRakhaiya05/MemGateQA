import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && f !== 'node_modules') walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(f)) acc.push(p);
  }
  return acc;
}

const tailwindPrefixes = new Set([
  'text', 'bg', 'flex', 'grid', 'min', 'max', 'p', 'm', 'w', 'h', 'gap', 'rounded', 'border',
  'font', 'items', 'justify', 'hidden', 'block', 'relative', 'absolute', 'fixed', 'overflow',
  'opacity', 'z', 'top', 'left', 'right', 'bottom', 'space', 'leading', 'tracking', 'uppercase',
  'lowercase', 'capitalize', 'truncate', 'whitespace', 'cursor', 'select', 'pointer', 'transition',
  'duration', 'ease', 'animate', 'hover', 'focus', 'active', 'disabled', 'lg', 'md', 'sm', 'xl',
  '2xl', 'group', 'sr-only', 'inline', 'col', 'row', 'self', 'place', 'object', 'aspect', 'ring',
  'shadow', 'divide', 'from', 'to', 'via', 'not', 'sr', 'list', 'table', 'align', 'break', 'box',
  'clear', 'float', 'isolate', 'mix', 'outline', 'resize', 'scroll', 'snap', 'touch', 'underline',
  'decoration', 'indent', 'hyphens', 'content', 'fill', 'stroke', 'visible', 'invisible', 'collapse',
  'origin', 'scale', 'rotate', 'translate', 'skew', 'transform', 'filter', 'backdrop', 'appearance',
  'accent', 'caret', 'columns', 'container', 'basis', 'grow', 'shrink', 'order', 'line', 'antialiased',
  'subpixel', 'italic', 'bold', 'medium', 'semibold', 'light', 'thin', 'extrabold', 'normal', 'prose',
  'mt', 'mb', 'ml', 'mr', 'mx', 'my', 'pt', 'pb', 'pl', 'pr', 'px', 'py', 'inset', 'size', 'aspect',
  'supports', 'print', 'dark', 'aria', 'data', 'nth', 'first', 'last', 'even', 'odd', 'only', 'empty',
  'required', 'valid', 'invalid', 'checked', 'default', 'indeterminate', 'placeholder', 'file', 'marker',
  'selection', 'target', 'open', 'where', 'is', 'has', 'peer', 'container', 'wrap', 'nowrap', 'contents',
  'static', 'sticky', 'sr', 'no', 'yes', 'true', 'false', 'fit', 'min-h', 'min-w', 'max-h', 'max-w',
]);

function isTailwind(c) {
  if (!c || c.includes('${') || c.includes('`') || c.includes('(')) return true;
  const base = c.split(':').pop();
  const prefix = base.split('-')[0];
  return tailwindPrefixes.has(prefix) || /^[A-Z]/.test(c) || /^\d/.test(c);
}

const used = new Set();
for (const file of walk('src')) {
  const txt = fs.readFileSync(file, 'utf8');
  for (const m of txt.matchAll(/className\s*=\s*(?:\{[`'"]([^`'"]+)[`'"]\}|"([^"]+)")/g)) {
    const raw = m[1] ?? m[2] ?? '';
    for (const part of raw.split(/\s+/)) {
      const clean = part.replace(/\$\{[^}]+\}/g, '').trim();
      if (clean && !isTailwind(clean)) used.add(clean);
    }
  }
  for (const m of txt.matchAll(/className\s*=\s*\{`([^`]+)`\}/g)) {
    for (const part of m[1].split(/\s+/)) {
      const clean = part.replace(/\$\{[^}]+\}/g, '').trim();
      if (clean && !isTailwind(clean)) used.add(clean);
    }
  }
  for (const m of txt.matchAll(/className\s*=\s*\{[^`"']+\}/g)) {
    for (const sm of m[0].matchAll(/['"]([a-z][\w-]*)['"]/g)) {
      if (!isTailwind(sm[1])) used.add(sm[1]);
    }
  }
}

const css = fs.readFileSync('src/index.css', 'utf8');
const defined = new Set([...css.matchAll(/^\.([a-zA-Z][\w-]*)/gm)].map((m) => m[1]));

const missing = [...used].filter((c) => !defined.has(c)).sort();
const unused = [...defined].filter((c) => !used.has(c)).sort();

console.log('Custom classes used:', used.size);
console.log('Custom classes defined:', defined.size);
console.log('\nMISSING (' + missing.length + '):');
console.log(missing.join('\n'));
console.log('\nUNUSED sample (' + unused.length + ' total):');
console.log(unused.slice(0, 80).join('\n'));