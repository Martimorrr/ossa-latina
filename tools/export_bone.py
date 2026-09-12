import bpy, sys, json, os, mathutils

argv = sys.argv[sys.argv.index("--") + 1:]
BONE, OUT = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath="/tmp/tts/skeletal.fbx")
bone = bpy.data.objects.get(BONE)
if not bone: print("### НЕТ КОСТИ", BONE); sys.exit(1)

side_suffix = ".t" if BONE.endswith(".r") else ".s"
labels = [o for o in bpy.data.objects
          if o.type == "EMPTY" and o.parent == bone and o.name.endswith(side_suffix)]

me = bone.data
me.calc_loop_triangles()
mw = bone.matrix_world

verts = [mw @ v.co for v in me.vertices]
# центрируем по геометрии и нормируем размер — чтобы вид не зависел от места кости в скелете
cx = sum(v.x for v in verts) / len(verts)
cy = sum(v.y for v in verts) / len(verts)
cz = sum(v.z for v in verts) / len(verts)
center = mathutils.Vector((cx, cy, cz))
span = max(max(abs(v.x-cx) for v in verts), max(abs(v.y-cy) for v in verts), max(abs(v.z-cz) for v in verts))
k = 1.0 / span

pos = []
for v in verts:
    p = (v - center) * k
    pos += [round(p.x, 4), round(p.y, 4), round(p.z, 4)]
idx = []
for t in me.loop_triangles: idx += list(t.vertices)

# метки в Z-Anatomy — это позиции текстовых выносок, вынесенные в сторону от кости;
# ставим точку на саму кость: ближайшая к выноске вершина поверхности
from mathutils.kdtree import KDTree
kd = KDTree(len(verts))
for i, v in enumerate(verts): kd.insert(v, i)
kd.balance()

marks = []
for o in labels:
    anchor = o.matrix_world.translation
    co, _, dist = kd.find(anchor)
    p = (co - center) * k
    marks.append({"n": o.name[:-2], "p": [round(p.x, 4), round(p.y, 4), round(p.z, 4)],
                  "d": round(dist * k, 3)})

data = {"positions": pos, "indices": idx, "labels": sorted(marks, key=lambda m: m["n"])}
json.dump(data, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"### {os.path.basename(OUT)}: вершин={len(verts)} треугольников={len(idx)//3} меток={len(marks)} размер={os.path.getsize(OUT)/1024:.0f} КБ")
