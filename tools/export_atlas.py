"""Экспорт атласа из Startup.blend Z-Anatomy.

   Даёт три вещи:
     bones/skeleton.bin + .json — обзорный скелет, прорежен до OVER
       треугольников на кость: обзору хватает силуэта.
     bones/d/<кость>.bin       — подробная модель, геометрия исходника
       целиком. Формат двоичный: те же данные в JSON весили вчетверо
       больше, поэтому полная детализация укладывается в прежний вес.
     bones/labels.json         — подписи структур с точками на поверхности.

   Подписи в Z-Anatomy устроены так: «<Структура>.t» — текст, дочерний
   объекту кости; «<Структура>.j» — двухвершинная выноска, дочерняя
   тексту, чей дальний конец и указывает на структуру. Где выноски нет,
   сажаем метку на ближайшую вершину поверхности.

   blender -b Startup.blend --python tools/export_atlas.py -- bones/ [OVER]
"""
import bpy, sys, json, os, re, struct, mathutils
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index("--") + 1:]
OUT  = argv[0]
OVER = int(argv[1]) if len(argv) > 1 else 1500

SK = bpy.data.collections["1: Skeletal system"]
slug = lambda n: re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", n.lower())).strip("-")

# подписи лежат в двух коллекциях: основной и бонусной — берём из обеих
FONTS = [o for o in bpy.data.objects if o.type == "FONT" and o.parent]

# настоящие кости: меши скелета, кроме выносок (.j) и точечных маркеров (.i)
bones = sorted((o for o in SK.all_objects
                if o.type == "MESH" and len(o.data.vertices) > 30
                and not o.name.endswith(".g")),
               key=lambda o: o.name)
print(f"### костей: {len(bones)}, вершин в исходнике: {sum(len(o.data.vertices) for o in bones):,}")

conv = lambda v: (v.x, v.z, -v.y)          # Blender Z-up → three.js Y-up

def geom(o, cap=None):
    """Треугольники в мировых координатах, при cap — прореженные."""
    o.data.calc_loop_triangles()
    n = len(o.data.loop_triangles)
    mod = None
    if cap and n > cap:
        mod = o.modifiers.new("dec", "DECIMATE")
        mod.ratio = cap / n
        me = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    else:
        me = o.data
    me.calc_loop_triangles()
    mw = o.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    tris  = [list(t.vertices) for t in me.loop_triangles]
    if mod:
        o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
        o.modifiers.remove(mod)
    return verts, tris

def quant(verts, tris):
    """Позиции Int16 по габариту самой кости — так точность выше общей."""
    cs = [conv(v) for v in verts]
    lo = [min(c[i] for c in cs) for i in range(3)]
    hi = [max(c[i] for c in cs) for i in range(3)]
    span = max(1e-6, max(hi[i] - lo[i] for i in range(3)))
    vb = bytearray()
    for c in cs:
        for i in range(3):
            vb += struct.pack("<H", max(0, min(65535, int(round((c[i] - lo[i]) / span * 65535)))))
    ib = bytearray()
    for t in tris: ib += struct.pack("<HHH", *t)
    return lo, span, vb, ib

# ─── подписи ────────────────────────────────────────────────────────
def labels_of(o, verts):
    """Метки кости: имя структуры и точка на её поверхности."""
    kd = KDTree(len(verts))
    for i, v in enumerate(verts): kd.insert(v, i)
    kd.balance()
    out = []
    for ch in FONTS:
        if ch.parent is not o: continue
        name = re.sub(r"\.[ts]$", "", ch.name)
        pt = None
        for j in ch.children:                       # выноска
            if j.type == "MESH" and len(j.data.vertices) == 2:
                pt = j.matrix_world @ j.data.vertices[-1].co
                break
        if pt is None: pt = ch.matrix_world.translation
        near, _, _ = kd.find(pt)                    # сажаем на поверхность
        out.append({"n": name, "p": [round(x, 4) for x in conv(near)]})
    twin = bpy.data.objects.get(o.name + ".001")
    for ch in FONTS:
        if twin and ch.parent is twin:
            name = re.sub(r"\.[ts]$", "", ch.name)
            pt = next((j.matrix_world @ j.data.vertices[-1].co for j in ch.children
                       if j.type == "MESH" and len(j.data.vertices) == 2), None)
            if pt is None: pt = ch.matrix_world.translation
            near, _, _ = kd.find(pt)
            out.append({"n": name, "p": [round(x, 4) for x in conv(near)]})
    seen, uniq = set(), []
    for l in sorted(out, key=lambda x: x["n"]):
        if l["n"] in seen: continue
        seen.add(l["n"]); uniq.append(l)
    return uniq

# ─── обзорный скелет ────────────────────────────────────────────────
os.makedirs(os.path.join(OUT, "d"), exist_ok=True)
parts, packs = [], []
lo_g = [1e9] * 3; hi_g = [-1e9] * 3
# бюджет обзора — доля от сложности исходного меша, с полом и потолком:
# фаланге силуэт даётся сотней треугольников, лопатке и черепу нужны тысячи,
# а длинному, но гладкому рёберному хрящу лишние ни к чему
caps = {}
for o in bones:
    o.data.calc_loop_triangles()
    caps[o.name] = max(100, min(2500, int(len(o.data.loop_triangles) * OVER / 1000)))
for o in bones:
    verts, tris = geom(o, caps[o.name])
    if not verts or not tris: continue
    cs = [conv(v) for v in verts]
    for c in cs:
        for i in range(3):
            lo_g[i] = min(lo_g[i], c[i]); hi_g[i] = max(hi_g[i], c[i])
    packs.append((o.name, cs, tris))
span_g = max(hi_g[i] - lo_g[i] for i in range(3))
print(f"### габарит {[round(hi_g[i]-lo_g[i],3) for i in range(3)]} м, шаг {span_g/65535*1000:.3f} мм")

vbuf, ibuf, voff, ioff = bytearray(), bytearray(), 0, 0
for name, cs, tris in packs:
    if len(cs) > 65535: print("### ПЕРЕПОЛНЕНИЕ", name); sys.exit(1)
    for c in cs:
        for i in range(3):
            vbuf += struct.pack("<H", max(0, min(65535, int(round((c[i]-lo_g[i])/span_g*65535)))))
    for t in tris: ibuf += struct.pack("<HHH", *t)
    base, side = (name[:-2], name[-1]) if name[-2:] in (".l", ".r") else (name, "")
    parts.append({"n": base, "s": side, "nv": len(cs), "nt": len(tris), "vo": voff, "io": ioff})
    voff += len(cs); ioff += len(tris)
blob = bytes(vbuf) + bytes(ibuf)
open(os.path.join(OUT, "skeleton.bin"), "wb").write(blob)
json.dump({"lo": [round(x,5) for x in lo_g], "span": round(span_g,5),
           "nv": voff, "nt": ioff, "parts": parts},
          open(os.path.join(OUT, "skeleton.json"), "w"), ensure_ascii=False, separators=(",",":"))
print(f"### обзор: вершин {voff:,} треугольников {ioff:,} → {len(blob)/1024:.0f} КБ")

# ─── подробные модели и подписи ─────────────────────────────────────
index, allb, nlab, det = {}, 0, 0, 0
for o in bones:
    verts, tris = geom(o)                      # без прореживания
    if not verts or not tris: continue
    if len(verts) > 65535: print("### слишком крупная", o.name); continue
    lo, span, vb, ib = quant(verts, tris)
    head = struct.pack("<4sII3ff", b"OSSB", len(verts), len(tris), *lo, span)
    f = slug(o.name) + ".bin"
    open(os.path.join(OUT, "d", f), "wb").write(head + bytes(vb) + bytes(ib))
    index[o.name] = f
    allb += len(head) + len(vb) + len(ib); det += 1
    L = labels_of(o, verts)
    if L: nlab += len(L)
    index.setdefault("__labels__", {})[o.name] = L
labels = index.pop("__labels__")
json.dump(index, open(os.path.join(OUT, "index.json"), "w"), ensure_ascii=False, separators=(",",":"))
json.dump(labels, open(os.path.join(OUT, "labels.json"), "w"), ensure_ascii=False, separators=(",",":"))
print(f"### подробных моделей {det}, вместе {allb/1024/1024:.1f} МБ, подписей {nlab}")
