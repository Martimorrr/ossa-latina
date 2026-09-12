/* Сверка bones.js с экспортированными данными: каждая кость должна быть
   в скелете, каждая метка — среди меток этой кости. Ловит опечатки в карте. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const M = eval(fs.readFileSync(path.join(root, 'bones.js'), 'utf8') +
               ';({BONE_NAMES,TERM_3D,G})');
const skel = JSON.parse(fs.readFileSync(path.join(root, 'bones/skeleton.json')));
const meshes = new Set(skel.parts.map(p => p.n));
const idx = JSON.parse(fs.readFileSync(path.join(root, 'bones/index.json')));

// метки по базовому имени кости
const labels = {};
for (const [mesh, file] of Object.entries(idx)) {
  const base = /\.[lr]$/.test(mesh) ? mesh.slice(0, -2) : mesh;
  const d = JSON.parse(fs.readFileSync(path.join(root, 'bones', file)));
  labels[base] = labels[base] || new Set();
  d.labels.forEach(l => labels[base].add(l.n));
}

let bad = 0;
const missName = [];
for (const m of meshes) if (!M.BONE_NAMES[m]) missName.push(m);
if (missName.length) { console.log('БЕЗ РУССКОГО НАЗВАНИЯ:', missName.join(', ')); bad += missName.length; }
for (const n of Object.keys(M.BONE_NAMES)) if (!meshes.has(n)) { console.log('НЕТ ТАКОГО МЕША:', n); bad++; }

let withLabel = 0, boneOnly = 0;
for (const [id, [b, lab]] of Object.entries(M.TERM_3D)) {
  const list = Array.isArray(b) ? b : [b];
  for (const one of list) if (!meshes.has(one)) { console.log(`✗ ${id}: нет кости "${one}"`); bad++; }
  if (lab) {
    const set = labels[list[0]];
    if (!set) { console.log(`✗ ${id}: у кости "${list[0]}" нет файла с метками`); bad++; }
    else if (!set.has(lab)) {
      console.log(`✗ ${id}: у "${list[0]}" нет метки "${lab}"`);
      bad++;
    } else withLabel++;
  } else boneOnly++;
}
console.log(`\nтерминов: ${Object.keys(M.TERM_3D).length} (с точкой ${withLabel}, кость целиком ${boneOnly})`);
console.log(bad ? `ОШИБОК: ${bad}` : 'ВСЁ СХОДИТСЯ');
