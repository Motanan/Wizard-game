"""
Generates the four pose variants of the Merlin 3D character (idle / thinking
/ happy / sad) used by the game, reusing the same procedural-mesh approach
and materials as the original storybook character model, parameterized by
head offset, brow offset, mouth shape, and per-arm chain coordinates.

idle uses the same geometry/coordinates as the original model (only the
material list order differs slightly, which does not affect rendering).

Usage: python3 tools/generate_merlin_poses.py
Requires: numpy, Pillow (pip install numpy pillow)
Writes assets/models/merlin-<pose>.glb and assets/models/merlin-poster.png.
"""
import json, math, struct
from pathlib import Path
import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'models'
OUT.mkdir(parents=True, exist_ok=True)


def build(pose):
    objects = []
    materials = []
    matmap = {}

    def mat(name, color, metallic=0.0, roughness=0.72, emissive=None):
        key = (name, tuple(color), metallic, roughness, tuple(emissive or (0, 0, 0)))
        if key not in matmap:
            matmap[key] = len(materials)
            m = {'name': name, 'pbrMetallicRoughness': {'baseColorFactor': list(color) + [1.0], 'metallicFactor': metallic, 'roughnessFactor': roughness}}
            if emissive:
                m['emissiveFactor'] = list(emissive)
            materials.append(m)
        return matmap[key]

    def add(name, material, verts, faces):
        v = np.asarray(verts, dtype=np.float32)
        f = np.asarray(faces, dtype=np.uint32).reshape((-1, 3))
        n = np.zeros_like(v)
        for tri in f:
            a, b, c = v[tri]
            nn = np.cross(b - a, c - a)
            for i in tri:
                n[i] += nn
        lens = np.linalg.norm(n, axis=1)
        n /= np.maximum(lens[:, None], 1e-9)
        objects.append({'name': name, 'material': material, 'verts': v, 'normals': n.astype(np.float32), 'faces': f})

    def ellipsoid(name, center, scale, material, nu=20, nv=14):
        verts = []
        faces = []
        for j in range(nv + 1):
            phi = math.pi * j / nv
            for i in range(nu):
                th = 2 * math.pi * i / nu
                verts.append((center[0] + scale[0] * math.sin(phi) * math.cos(th), center[1] + scale[1] * math.cos(phi), center[2] + scale[2] * math.sin(phi) * math.sin(th)))
        for j in range(nv):
            for i in range(nu):
                a = j * nu + i
                b = j * nu + (i + 1) % nu
                c = (j + 1) * nu + (i + 1) % nu
                d = (j + 1) * nu + i
                faces.extend(((a, d, b), (b, d, c)))
        add(name, material, verts, faces)

    def lathe(name, profile, material, seg=28):
        verts = []
        faces = []
        for y, r in profile:
            for i in range(seg):
                t = 2 * math.pi * i / seg
                verts.append((r * math.cos(t), y, r * math.sin(t)))
        for j in range(len(profile) - 1):
            for i in range(seg):
                a = j * seg + i
                b = j * seg + (i + 1) % seg
                c = (j + 1) * seg + (i + 1) % seg
                d = (j + 1) * seg + i
                faces.extend(((a, b, d), (b, c, d)))
        add(name, material, verts, faces)

    def cylinder_between(name, p1, p2, radius, material, seg=16, radius2=None):
        p1 = np.array(p1, float)
        p2 = np.array(p2, float)
        axis = p2 - p1
        L = np.linalg.norm(axis)
        axis /= L
        helper = np.array([0, 0, 1.]) if abs(axis[1]) > .9 else np.array([0, 1., 0])
        u = np.cross(axis, helper)
        u /= np.linalg.norm(u)
        w = np.cross(axis, u)
        verts = []
        faces = []
        r2 = radius if radius2 is None else radius2
        for center, r in ((p1, radius), (p2, r2)):
            for i in range(seg):
                t = 2 * math.pi * i / seg
                q = center + r * (math.cos(t) * u + math.sin(t) * w)
                verts.append(q)
        for i in range(seg):
            j = (i + 1) % seg
            faces.extend(((i, j, seg + j), (i, seg + j, seg + i)))
        verts.extend([p1, p2])
        c0 = len(verts) - 2
        c1 = len(verts) - 1
        for i in range(seg):
            j = (i + 1) % seg
            faces.extend(((c0, j, i), (c1, seg + i, seg + j)))
        add(name, material, verts, faces)

    def torus(name, center, major, minor, material, nu=32, nv=10):
        verts = []
        faces = []
        for i in range(nu):
            t = 2 * math.pi * i / nu
            for j in range(nv):
                q = 2 * math.pi * j / nv
                rr = major + minor * math.cos(q)
                verts.append((center[0] + rr * math.cos(t), center[1] + minor * math.sin(q), center[2] + rr * math.sin(t)))
        for i in range(nu):
            for j in range(nv):
                a = i * nv + j
                b = ((i + 1) % nu) * nv + j
                c = ((i + 1) % nu) * nv + (j + 1) % nv
                d = i * nv + (j + 1) % nv
                faces.extend(((a, b, d), (b, c, d)))
        add(name, material, verts, faces)

    def extruded_star(name, center, radius, depth, material, points=5):
        x, y, z = center
        outline = []
        for i in range(points * 2):
            a = math.pi / 2 + i * math.pi / points
            r = radius if i % 2 == 0 else radius * .46
            outline.append((x + math.cos(a) * r, y + math.sin(a) * r))
        verts = [(xx, yy, z - depth / 2) for xx, yy in outline] + [(xx, yy, z + depth / 2) for xx, yy in outline]
        front = len(verts)
        verts.append((x, y, z + depth / 2))
        back = len(verts)
        verts.append((x, y, z - depth / 2))
        faces = []
        n = len(outline)
        for i in range(n):
            j = (i + 1) % n
            faces.extend(((front, n + i, n + j), (back, j, i), (i, j, n + j), (i, n + j, n + i)))
        add(name, material, verts, faces)

    robe = mat('Deep plum blue robe', (.22, .20, .60), roughness=.77)
    robe_hi = mat('Robe folds', (.31, .29, .72), roughness=.8)
    robe_dark = mat('Robe shadow', (.14, .14, .43), roughness=.82)
    gold = mat('Polished storybook gold', (.98, .66, .16), metallic=.35, roughness=.42)
    skin = mat('Warm peach skin', (1.0, .70, .50), roughness=.66)
    skin_shadow = mat('Ear blush', (.91, .39, .34), roughness=.7)
    beard = mat('Pearl silver beard', (.91, .91, 1.0), roughness=.88)
    beard_hi = mat('Soft beard highlights', (1.0, .98, .90), roughness=.84)
    hat = mat('Teal wizard hat', (.08, .48, .53), roughness=.73)
    hat_hi = mat('Hat fold highlights', (.12, .62, .64), roughness=.7)
    white = mat('Eye whites', (1.0, .98, .91), roughness=.42)
    iris = mat('Bright blue eyes', (.12, .54, .82), roughness=.36)
    black = mat('Pupils and brows', (.13, .11, .20), roughness=.48)
    shoe = mat('Dark plum shoes', (.24, .11, .32), roughness=.72)
    crystal = mat('Luminous sky blue crystal', (.34, .84, 1.0), metallic=.1, roughness=.24, emissive=(.16, .55, .85))
    cape = mat('Cape lining', (.42, .22, .62), roughness=.8)
    smile_happy = mat('Big happy smile', (.80, .27, .22), roughness=.6)
    smile_sad = mat('Soft downturned mouth', (.80, .55, .48), roughness=.7)

    # ---- pose parameters -------------------------------------------------
    # head_off: (dx, dy, dz) applied to head + all face features
    # brow_dy: (left, right) extra y-offset for eyebrows (negative = furrowed)
    # brow_in: (left, right) extra x pull toward center (worried brows)
    # mouth: (dy, dz, sx, sy, material) for the smile-crease ellipsoid
    # arm(side): dict with sleeve/cuff/hand/trim coordinates for that side
    POSES = {
        'idle': dict(
            head_off=(0, 0, 0), brow_dy=(0, 0), brow_in=(0, 0),
            mouth=(0, 0, 1.0, 1.0, skin_shadow),
            arm=lambda side: dict(
                sleeve=(side * .48, 1.55, .01), sleeve_s=(.34, .29, .31),
                cuff1=(side * .61, 1.51, .01), cuff2=(side * .78, 1.48, .01), r1=.20, r2=.17,
                hand=(side * .84, 1.47, .04), hand_s=(.16, .15, .16),
                trim=(side * .76, 1.48, .01),
            ),
        ),
        'thinking': dict(
            head_off=(.05, .01, 0), brow_dy=(0, .028), brow_in=(0, 0),
            mouth=(-.01, 0, .85, .85, skin_shadow),
            arm=lambda side: dict(
                sleeve=(side * .48, 1.55, .01) if side < 0 else (side * .42, 1.92, .16),
                sleeve_s=(.34, .29, .31) if side < 0 else (.28, .26, .27),
                cuff1=(side * .61, 1.51, .01) if side < 0 else (side * .48, 2.05, .28),
                cuff2=(side * .78, 1.48, .01) if side < 0 else (side * .30, 2.10, .40),
                r1=.20 if side < 0 else .17, r2=.17 if side < 0 else .145,
                hand=(side * .84, 1.47, .04) if side < 0 else (side * .22, 2.10, .46),
                hand_s=(.16, .15, .16) if side < 0 else (.145, .135, .145),
                trim=(side * .76, 1.48, .01) if side < 0 else (side * .27, 2.09, .42),
            ),
        ),
        'happy': dict(
            head_off=(0, .045, 0), brow_dy=(.03, .03), brow_in=(0, 0),
            mouth=(.02, .01, 1.55, 1.7, smile_happy),
            arm=lambda side: dict(
                sleeve=(side * .40, 2.05, .10), sleeve_s=(.30, .28, .29),
                cuff1=(side * .50, 2.28, .18), cuff2=(side * .58, 2.52, .22), r1=.185, r2=.155,
                hand=(side * .63, 2.70, .22), hand_s=(.155, .145, .155),
                trim=(side * .56, 2.51, .21),
            ),
        ),
        'sad': dict(
            head_off=(0, -.075, .045), brow_dy=(-.03, -.03), brow_in=(.03, .03),
            mouth=(-.03, -.01, 1.1, .8, smile_sad),
            arm=lambda side: dict(
                sleeve=(side * .50, 1.32, -.02), sleeve_s=(.32, .27, .29),
                cuff1=(side * .58, 1.16, -.03), cuff2=(side * .66, 0.98, -.03), r1=.18, r2=.15,
                hand=(side * .70, 0.86, -.02), hand_s=(.15, .14, .15),
                trim=(side * .64, 0.97, -.03),
            ),
        ),
    }
    P = POSES[pose]
    hx, hy, hz = P['head_off']

    ellipsoid('Left rounded boot', (-.28, .13, .10), (.25, .16, .38), shoe)
    ellipsoid('Right rounded boot', (.28, .13, .10), (.25, .16, .38), shoe)
    ellipsoid('Left boot gold buckle', (-.28, .20, .45), (.085, .065, .035), gold, 14, 10)
    ellipsoid('Right boot gold buckle', (.28, .20, .45), (.085, .065, .035), gold, 14, 10)
    lathe('Flowing bell shaped robe', [(.20, .25), (.28, .47), (.42, .52), (.78, .38), (1.15, .28), (1.48, .31), (1.68, .40), (1.80, .34)], robe, 40)
    lathe('Gold embroidered robe hem', [(.24, .48), (.30, .51)], gold, 40)
    for x in (-.20, .0, .20):
        ellipsoid('Robe front fold', (x, .91, .267 if x else .30), (.055, .52, .028), robe_hi, 12, 14)
    ellipsoid('Short plum cape', (0, 1.55, -.18), (.60, .39, .20), cape, 24, 16)
    lathe('Gold waist sash', [(1.27, .296), (1.37, .31)], gold, 36)
    ellipsoid('Sash center gem', (0, 1.32, .315), (.12, .13, .055), crystal, 16, 12)

    for side in (-1, 1):
        tag = 'Left' if side < 0 else 'Right'
        a = P['arm'](side)
        ellipsoid(tag + ' puff sleeve', a['sleeve'], a['sleeve_s'], robe_hi, 18, 12)
        cylinder_between(tag + ' sleeve cuff', a['cuff1'], a['cuff2'], a['r1'], robe, 18, a['r2'])
        ellipsoid(tag + ' hand', a['hand'], a['hand_s'], skin, 18, 12)
        torus(tag + ' cuff trim', a['trim'], .16, .025, gold, 20, 8)

    ellipsoid('Head', (0 + hx, 2.12 + hy, .02 + hz), (.43, .48, .38), skin, 28, 20)
    for side in (-1, 1):
        tag = 'Left' if side < 0 else 'Right'
        bi = 0 if side < 0 else 1
        bdy = P['brow_dy'][bi]
        bin_ = P['brow_in'][bi] * (-side)
        ellipsoid(tag + ' ear', (side * .405 + hx, 2.10 + hy, .01 + hz), (.12, .16, .10), skin, 16, 12)
        ellipsoid(tag + ' rosy cheek', (side * .24 + hx, 1.99 + hy, .325 + hz), (.095, .055, .028), skin_shadow, 14, 10)
        ellipsoid(tag + ' eye white', (side * .16 + hx, 2.19 + hy, .359 + hz), (.105, .135, .073), white, 18, 14)
        ellipsoid(tag + ' blue iris', (side * .145 + hx, 2.18 + hy, .422 + hz), (.055, .074, .025), iris, 16, 12)
        ellipsoid(tag + ' pupil', (side * .14 + hx, 2.18 + hy, .443 + hz), (.027, .043, .018), black, 12, 10)
        ellipsoid(tag + ' eye sparkle', (side * .15 + hx, 2.215 + hy, .458 + hz), (.016, .022, .012), white, 10, 8)
        ellipsoid(tag + ' friendly brow', (side * .16 + hx + bin_, 2.36 + hy + bdy, .38 + hz), (.11, .032, .045), black, 14, 8)
    ellipsoid('Small nose', (0 + hx, 2.07 + hy, .43 + hz), (.075, .09, .08), skin, 16, 12)
    ellipsoid('Left curled moustache', (-.115 + hx, 1.96 + hy, .40 + hz), (.16, .085, .07), beard, 18, 10)
    ellipsoid('Right curled moustache', (.115 + hx, 1.96 + hy, .40 + hz), (.16, .085, .07), beard, 18, 10)
    ellipsoid('Full flowing beard', (0 + hx, 1.65 + hy, .10 + hz), (.35, .48, .29), beard, 24, 16)
    for x, y, s in [(-.18, 1.62, .12), (0, 1.48, .14), (.18, 1.62, .12), (-.10, 1.35, .10), (.10, 1.35, .10)]:
        ellipsoid('Layered beard curl', (x + hx, y + hy, .30 + hz), (.10, s, .075), beard_hi, 14, 10)
    mdy, mdz, msx, msy, mmat = P['mouth']
    ellipsoid('Warm smile', (0 + hx, 1.91 + hy + mdy, .455 + hz + mdz), (.10 * msx, .025 * msy, .018), mmat, 14, 8)

    lathe('Wide floppy hat brim', [(2.48, .18), (2.52, .47), (2.58, .56), (2.62, .50), (2.64, .20)], hat, 40)
    lathe('Golden hat band', [(2.61, .35), (2.67, .34)], gold, 32)
    lathe('Curved pointed hat crown', [(2.62, .30), (2.82, .25), (3.05, .18), (3.25, .105), (3.36, .0)], hat, 32)
    ellipsoid('Bent hat tip', (0, 3.34, .0), (.09, .12, .09), hat_hi, 16, 12)
    extruded_star('Hat golden star', (.17, 2.91, .215), .11, .045, gold)
    extruded_star('Hat small star', (-.16, 3.10, .12), .055, .035, gold)

    cylinder_between('Wizard staff wooden shaft', (-1.08, .28, .02), (-1.08, 2.63, .02), .055, gold, 12, .045)
    for y in (.55, 1.0, 1.45, 1.90):
        torus('Staff carved grip ring', (-1.08, y, .02), .052, .012, robe_dark, 12, 6)
    ellipsoid('Staff crystal collar', (-1.08, 2.64, .02), (.16, .09, .14), gold, 14, 10)
    extruded_star('Large sky blue star crystal', (-1.08, 2.84, .02), .24, .16, crystal)
    for p in [(-.79, 2.83, .03), (-1.37, 2.95, .02), (-.88, 3.13, .01)]:
        extruded_star('Floating tiny magic sparkle', p, .055, .035, gold, 4)

    # ---- export ------------------------------------------------------
    blob = bytearray()
    views = []
    accessors = []

    def align4():
        while len(blob) % 4:
            blob.append(0)

    def add_accessor(data, component, typ, count, target, minmax=False):
        align4()
        offset = len(blob)
        raw = data.tobytes(order='C')
        blob.extend(raw)
        vi = len(views)
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(raw), 'target': target})
        ac = {'bufferView': vi, 'componentType': component, 'count': count, 'type': typ}
        if minmax:
            arr = np.asarray(data).reshape((-1, 3))
            ac['min'] = arr.min(axis=0).astype(float).tolist()
            ac['max'] = arr.max(axis=0).astype(float).tolist()
        accessors.append(ac)
        return len(accessors) - 1

    meshes = []
    nodes = []
    for obj in objects:
        pos = add_accessor(obj['verts'], 5126, 'VEC3', len(obj['verts']), 34962, True)
        nor = add_accessor(obj['normals'], 5126, 'VEC3', len(obj['normals']), 34962)
        idx = add_accessor(obj['faces'].astype(np.uint32).ravel(), 5125, 'SCALAR', obj['faces'].size, 34963)
        meshes.append({'name': obj['name'], 'primitives': [{'attributes': {'POSITION': pos, 'NORMAL': nor}, 'indices': idx, 'material': obj['material'], 'mode': 4}]})
        nodes.append({'name': obj['name'], 'mesh': len(meshes) - 1})
    align4()
    doc = {'asset': {'version': '2.0', 'generator': 'Merlin Storybook character creator'}, 'scene': 0, 'scenes': [{'name': 'Merlin', 'nodes': list(range(len(nodes)))}], 'nodes': nodes, 'meshes': meshes, 'materials': materials, 'accessors': accessors, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    js = json.dumps(doc, separators=(',', ':')).encode('utf-8')
    js += b' ' * ((-len(js)) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    glb = struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + blob
    glb_path = OUT / f'merlin-{pose}.glb'
    glb_path.write_bytes(glb)
    print(f'Created {glb_path} ({glb_path.stat().st_size:,} bytes)')

    if pose == 'idle':
        W, H, S = 720, 900, 2
        w, h = W * S, H * S
        im = Image.new('RGB', (w, h), (0, 0, 0, 0))
        zbuf = np.full((h, w), 1e9, dtype=np.float32)
        pix = np.zeros((h, w, 4), dtype=np.uint8)
        light = np.array([-.40, .78, .48])
        light /= np.linalg.norm(light)

        def project(p):
            return np.array([w / 2 + p[0] * 180 * S, h - 80 * S - p[1] * 205 * S, -p[2]])

        for ob in objects:
            base = np.array(materials[ob['material']]['pbrMetallicRoughness']['baseColorFactor'][:3])
            base = np.power(base, 1 / 2.2) * 255
            vv = np.array([project(p) for p in ob['verts']])
            nn = ob['normals']
            for tri in ob['faces']:
                pts = vv[tri]
                x0 = max(0, int(np.floor(pts[:, 0].min())))
                x1 = min(w - 1, int(np.ceil(pts[:, 0].max())))
                y0 = max(0, int(np.floor(pts[:, 1].min())))
                y1 = min(h - 1, int(np.ceil(pts[:, 1].max())))
                if x1 < x0 or y1 < y0:
                    continue
                a, b, c = pts[:, :2]
                den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
                if abs(den) < 1e-6:
                    continue
                Y, X = np.mgrid[y0:y1 + 1, x0:x1 + 1]
                wa = ((b[1] - c[1]) * (X - c[0]) + (c[0] - b[0]) * (Y - c[1])) / den
                wb = ((c[1] - a[1]) * (X - c[0]) + (a[0] - c[0]) * (Y - c[1])) / den
                wc = 1 - wa - wb
                inside = (wa >= 0) & (wb >= 0) & (wc >= 0)
                depth = wa * pts[0, 2] + wb * pts[1, 2] + wc * pts[2, 2]
                region = zbuf[y0:y1 + 1, x0:x1 + 1]
                take = inside & (depth < region)
                if not take.any():
                    continue
                nrm = nn[tri].mean(axis=0)
                nrm = nrm / max(np.linalg.norm(nrm), 1e-8)
                shade = .54 + .46 * max(0, float(np.dot(nrm, light)))
                if ob['material'] == crystal:
                    shade = 1.16
                col = np.clip(base * shade, 0, 255).astype(np.uint8)
                region[take] = depth[take]
                pix[y0:y1 + 1, x0:x1 + 1][take] = [col[0], col[1], col[2], 255]
        im = Image.fromarray(pix, mode='RGBA').resize((W, H), Image.Resampling.LANCZOS)
        poster = OUT / 'merlin-poster.png'
        im.save(poster)
        print(f'Created {poster} ({poster.stat().st_size:,} bytes)')


if __name__ == '__main__':
    for pose in ['idle', 'thinking', 'happy', 'sad']:
        build(pose)
