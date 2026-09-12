"""Пакетный экспорт детальных моделей костей с метками структур.

   В отличие от обзорного скелета, здесь геометрия подробная (до CAP
   треугольников) — её подгружают по одной кости, когда пользователь
   выбрал её в атласе. Координаты те же мировые, что у skeleton.bin,
   поэтому подробная кость встаёт ровно на место грубой и переход
   от скелета к кости получается непрерывным.

   Метки Z-Anatomy — позиции текстовых выносок, вынесенные в сторону
   от кости; каждую сажаем на ближайшую вершину поверхности.

   blender -b --python tools/export_bone.py -- bones/ [CAP]
"""
import bpy, sys, json, os, re, mathutils
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
CAP = int(argv[1]) if len(argv) > 1 else 8000
FBX = "/tmp/tts/skeletal.fbx"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX)

def slug(n):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", n.lower())).strip("-")

targets = []
for o in bpy.data.objects:
    if o.type != "MESH": continue
    if not any(m and m.name.startswith("Bone") for m in o.data.materials): continue
    labs = [c for c in bpy.data.objects if c.type == "EMPTY" and c.parent == o]
    if labs: targets.append((o, labs))
targets.sort(key=lambda p: p[0].name)
print(f"### костей с метками: {len(targets)}")

os.makedirs(OUT, exist_ok=True)
index, total = {}, 0
for o, labs in targets:
    o.data.calc_loop_triangles()
    n = len(o.data.loop_triangles)
    mod = None
    if n > CAP:
        mod = o.modifiers.new("dec", "DECIMATE")
        mod.ratio = CAP / n
        me = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    else:
        me = o.data
    me.calc_loop_triangles()
    mw = o.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    tris = [list(t.vertices) for t in me.loop_triangles]

    kd = KDTree(len(verts))
    for i, v in enumerate(verts): kd.insert(v, i)
    kd.balance()

    # Blender Z-up -> three.js Y-up
    def conv(v): return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]

    pos = []
    for v in verts: pos += conv(v)
    idx = []
    for t in tris: idx += t

    marks, off = [], []
    for c in labs:
        anchor = c.matrix_world.translation
        co, _, dist = kd.find(anchor)
        nm = c.name[:-2] if c.name[-2:] in (".t", ".s") else c.name
        marks.append({"n": nm, "p": conv(co), "d": round(dist, 4)})
        off.append(dist)
    marks.sort(key=lambda m: m["n"])

    if mod:
        o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
        o.modifiers.remove(mod)

    fn = slug(o.name) + ".json"
    json.dump({"positions": pos, "indices": idx, "labels": marks},
              open(os.path.join(OUT, fn), "w"), ensure_ascii=False,
              separators=(",", ":"))
    kb = os.path.getsize(os.path.join(OUT, fn)) / 1024
    total += kb
    off.sort()
    index[o.name] = fn
    print(f"###   {o.name:<34} {len(tris):>6}t {len(marks):>3}lab {kb:>6.0f} КБ  медиана выноски {off[len(off)//2]:.3f}")

json.dump(index, open(os.path.join(OUT, "index.json"), "w"),
          ensure_ascii=False, separators=(",", ":"))
print(f"### файлов: {len(index)}  суммарно {total/1024:.1f} МБ")
