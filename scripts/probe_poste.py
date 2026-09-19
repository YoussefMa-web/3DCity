import bpy

coll = bpy.data.collections.get("NETIS_Poste_Source")
print("found", coll is not None, flush=True)
if not coll:
    raise SystemExit(1)

objs = [o for o in coll.all_objects if o.type == "MESH" and o.data and len(o.data.vertices)]
print("mesh objects", len(objs), flush=True)

def world_bb(obj):
    xs, ys, zs = [], [], []
    for corner in obj.bound_box:
        w = obj.matrix_world @ __import__("mathutils").Vector(corner)
        xs.append(w.x)
        ys.append(w.y)
        zs.append(w.z)
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)

import mathutils  # noqa: F401

xs0, xs1, ys0, ys1, zs0, zs1 = [], [], [], [], [], []
huge = 0
near = 0
for obj in objs:
    a, b, c, d, e, f = world_bb(obj)
    span = max(b - a, d - c, f - e)
    if span > 400 or abs(a) > 2000 or abs(c) > 2000:
        huge += 1
        continue
    near += 1
    xs0.append(a); xs1.append(b); ys0.append(c); ys1.append(d); zs0.append(e); zs1.append(f)

print("huge", huge, "near", near, flush=True)
if xs0:
    print("near bounds", min(xs0), max(xs1), min(ys0), max(ys1), min(zs0), max(zs1), flush=True)

prefixes = {}
for obj in objs[:]:
    key = obj.name.split(".")[0]
    prefixes[key] = prefixes.get(key, 0) + 1
top = sorted(prefixes.items(), key=lambda kv: -kv[1])[:20]
print("prefixes", top, flush=True)
