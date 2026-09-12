"""Экспорт обзорного скелета из Z-Anatomy в компактный бинарь.

   Все кости кладутся в один буфер: позиции Int16 (квантованы по общему
   габариту скелета), индексы Uint16 с локальной нумерацией внутри кости —
   так каждый блок заведомо влезает в 16 бит, а собрать их в один
   Uint32-индекс умеет уже клиент. Крупные кости прорежены до CAP
   треугольников: обзору хватает силуэта, детали смотрим в отдельной модели.

   blender -b --python tools/export_skeleton.py -- bones/
"""
import bpy, sys, json, os, struct, mathutils

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
CAP = int(argv[1]) if len(argv) > 1 else 600
FBX = "/tmp/tts/skeletal.fbx"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX)

bones = []
for o in bpy.data.objects:
    if o.type != "MESH": continue
    if not any(m and m.name.startswith("Bone") for m in o.data.materials): continue
    bones.append(o)
bones.sort(key=lambda o: o.name)
print(f"### костей: {len(bones)}")

dg = bpy.context.evaluated_depsgraph_get()

def mesh_of(o):
    """Прореженный меш в мировых координатах."""
    o.data.calc_loop_triangles()
    n = len(o.data.loop_triangles)
    mod = None
    if n > CAP:
        mod = o.modifiers.new("dec", "DECIMATE")
        mod.ratio = CAP / n
        dgl = bpy.context.evaluated_depsgraph_get()
        me = o.evaluated_get(dgl).to_mesh()
    else:
        me = o.data
    me.calc_loop_triangles()
    mw = o.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    tris = [list(t.vertices) for t in me.loop_triangles]
    if mod:
        o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
        o.modifiers.remove(mod)
    return verts, tris

parts = []
lo = mathutils.Vector((1e9, 1e9, 1e9))
hi = mathutils.Vector((-1e9, -1e9, -1e9))
for o in bones:
    verts, tris = mesh_of(o)
    if not verts or not tris: continue
    for v in verts:
        for i in range(3):
            lo[i] = min(lo[i], v[i]); hi[i] = max(hi[i], v[i])
    parts.append((o.name, verts, tris))

# Blender Z-up -> three.js Y-up: (x, y, z) -> (x, z, -y)
def conv(v): return (v.x, v.z, -v.y)
clo = [lo.x, lo.z, -hi.y]
chi = [hi.x, hi.z, -lo.y]
span = max(chi[i] - clo[i] for i in range(3))
print(f"### габарит: {[round(chi[i]-clo[i],3) for i in range(3)]} м, шаг квантования {span/65535*1000:.3f} мм")

vbuf, ibuf, meta, voff, ioff = bytearray(), bytearray(), [], 0, 0
for name, verts, tris in parts:
    if len(verts) > 65535:
        print("### ПЕРЕПОЛНЕНИЕ", name, len(verts)); sys.exit(1)
    for v in verts:
        c = conv(v)
        for i in range(3):
            q = int(round((c[i] - clo[i]) / span * 65535))
            vbuf += struct.pack("<H", max(0, min(65535, q)))
    for t in tris:
        ibuf += struct.pack("<HHH", *t)
    base, side = (name[:-2], name[-1]) if name[-2:] in (".l", ".r") else (name, "")
    meta.append({"n": base, "s": side, "nv": len(verts), "nt": len(tris),
                 "vo": voff, "io": ioff})
    voff += len(verts); ioff += len(tris)

blob = bytes(vbuf) + bytes(ibuf)
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, "skeleton.bin"), "wb").write(blob)
json.dump({"lo": [round(x, 5) for x in clo], "span": round(span, 5),
           "nv": voff, "nt": ioff, "parts": meta},
          open(os.path.join(OUT, "skeleton.json"), "w"), ensure_ascii=False,
          separators=(",", ":"))
print(f"### вершин={voff} треугольников={ioff} bin={len(blob)/1024:.0f} КБ")
