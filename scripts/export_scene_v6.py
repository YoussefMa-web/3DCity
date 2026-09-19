"""Export the open Blender scene (NETCOM_datacenter_ville_v6) into the new campus app.

Does not touch the previous project's models. Run inside Blender.
"""
from __future__ import annotations

import json
import os
from datetime import datetime

import bpy

OUT = r"C:\Users\y.chakir\Documents\campus final\campus\public\models"
os.makedirs(OUT, exist_ok=True)

SECTIONS = [
    ("site", ["tracage route", "lampadaire", "Modern House", "grillage", "vehicules", "asphalte", "trettoir"]),
    ("telecom", ["NETIS_1_SITE_TELECOM"]),
    ("solar", ["Solar aPlant", "Carpot", "Roof Top solar data Center", "roof top solaire", "solar rooftop villa"]),
    ("datacenter", ["Data Center"]),
    ("reseau", ["RESEAU_ELECTRIQUE"]),
    ("poste", ["NETIS_Poste_Source", "NETIS_Poste_Livraison_Commun"]),
    ("noc", ["NOC"]),
]


def log(msg: str) -> None:
    print(f"{datetime.now().isoformat(timespec='seconds')} {msg}", flush=True)


def mesh_ok(obj) -> bool:
    mesh = obj.data
    n_loops = len(mesh.loops)
    n_verts = len(mesh.vertices)
    if n_verts == 0 or n_loops == 0:
        return n_verts > 0
    try:
        idx = [0] * n_loops
        mesh.loops.foreach_get("vertex_index", idx)
        return max(idx) < n_verts
    except Exception:
        return False


def drop_broken_uvs(meshes: list) -> None:
    for obj in meshes:
        mesh = obj.data
        loop_count = len(mesh.loops)
        if loop_count == 0:
            continue
        broken = [uv.name for uv in mesh.uv_layers if len(uv.uv) != loop_count]
        for name in broken:
            mesh.uv_layers.remove(mesh.uv_layers[name])
            log(f"dropped UV {name} on {obj.name}")


def collect(names: list[str]) -> list:
    seen: set[int] = set()
    out = []
    for name in names:
        objs = []
        coll = bpy.data.collections.get(name)
        if coll:
            objs = list(coll.all_objects)
        else:
            obj = bpy.data.objects.get(name)
            if obj:
                objs = [obj]
        for obj in objs:
            if obj.type != "MESH" or obj.data is None or len(obj.data.vertices) == 0 or not mesh_ok(obj):
                continue
            key = obj.as_pointer()
            if key in seen:
                continue
            seen.add(key)
            out.append(obj)
    return out


def view3d_override():
    for window in bpy.context.window_manager.windows:
        screen = window.screen
        for area in screen.areas:
            if area.type == "VIEW_3D":
                for region in area.regions:
                    if region.type == "WINDOW":
                        return {"window": window, "screen": screen, "area": area, "region": region}
    return None


def export_one(filename: str, names: list[str]) -> dict:
    meshes = collect(names)
    path = os.path.join(OUT, filename)
    log(f"export {filename} meshes={len(meshes)}")
    if not meshes:
        return {"id": filename.replace(".glb", ""), "file": filename, "meshes": 0, "skipped": True}

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
            log(f"skip select {obj.name}: {exc}")
    view.objects.active = meshes[0]
    drop_broken_uvs(meshes)
    log(f"selected {selected}")

    override = view3d_override()
    export_kwargs = dict(
        filepath=path,
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
        export_image_quality=80,
    )
    if override:
        with bpy.context.temp_override(**override):
            bpy.ops.export_scene.gltf(**export_kwargs)
    else:
        bpy.ops.export_scene.gltf(**export_kwargs)

    size_mb = round(os.path.getsize(path) / (1024 * 1024), 2)
    log(f"wrote {filename} {size_mb} MB")
    return {"id": filename.replace(".glb", ""), "file": filename, "meshes": len(meshes), "size_mb": size_mb}


def main() -> None:
    sections = []
    for sid, names in SECTIONS:
        sections.append(export_one(f"{sid}.glb", names))
    manifest = {
        "version": 1,
        "source": bpy.data.filepath,
        "exported_at": datetime.now().isoformat(timespec="seconds"),
        "space": "three-y-up",
        "sections": sections,
    }
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
    log("manifest written")


if __name__ == "__main__":
    main()
