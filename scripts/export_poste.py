"""Export only the electrical substations from the campus blend."""
import os
import bpy

OUT = r"C:\Users\y.chakir\Documents\campus final\campus\public\models\poste.glb"
NAMES = ["NETIS_Poste_Source", "NETIS_Poste_Livraison_Commun"]

seen = set()
meshes = []
for name in NAMES:
    coll = bpy.data.collections.get(name)
    objs = list(coll.all_objects) if coll else []
    if not objs:
        obj = bpy.data.objects.get(name)
        objs = [obj] if obj else []
    print(f"collect {name} count={len(objs)}", flush=True)
    for obj in objs:
        if obj is None or obj.type != "MESH" or obj.data is None or len(obj.data.vertices) == 0:
            continue
        key = obj.as_pointer()
        if key in seen:
            continue
        seen.add(key)
        meshes.append(obj)

print(f"meshes {len(meshes)}", flush=True)
if not meshes:
    raise SystemExit("no poste meshes")

for coll in bpy.data.collections:
    coll.hide_select = False
    coll.hide_viewport = False
for obj in bpy.data.objects:
    obj.hide_select = False
    obj.hide_viewport = False

view = bpy.context.view_layer
view.update()
for obj in view.objects:
    obj.select_set(False)

selected = 0
for obj in meshes:
    try:
        obj.hide_set(False)
        obj.select_set(True)
        selected += 1
    except Exception as exc:
        print(f"skip {obj.name}: {exc}", flush=True)

view.objects.active = meshes[0]
print(f"selected {selected}", flush=True)

bpy.ops.export_scene.gltf(
    filepath=OUT,
    use_selection=True,
    export_format="GLB",
    export_apply=False,
    export_texcoords=True,
    export_normals=True,
    export_tangents=False,
    export_materials="EXPORT",
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    export_skins=False,
    export_morph=False,
    export_yup=True,
    export_image_format="JPEG",
    export_image_quality=90,
)
print(f"wrote {OUT} {os.path.getsize(OUT)}", flush=True)
