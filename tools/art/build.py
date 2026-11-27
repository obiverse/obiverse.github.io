# The site's illustrations, built and lit in code: one camera, one light, one palette.
#
#   /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P tools/art/build.py -- <scene> [<scene>...]
#   scenes: hero records leak message web apps      (writes tools/art/out/<scene>.png; hero also writes art/flow.glb)
#
# Transparent background, no floor: the page adds a soft drop-shadow, so every picture sits on the light and dark theme alike.
# Screens on the phones are web pages photographed by Chrome (tools/art/screens/*.png).
import bpy, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
LOW = '--glb' in sys.argv          # the model three.js plays: fewer segments, no coins (it makes its own)
SITE = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)


def lin(hex_):
    c = [int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1,)


# ---- scene, camera, light ----------------------------------------------------------------------

def reset(w=1200, h=1000, scale=7.0, target=(0, 0, 0.4)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices: d.use = True
    s.cycles.device = 'GPU'
    s.cycles.samples = 160
    s.cycles.use_denoising = True
    s.render.film_transparent = True
    s.render.resolution_x, s.render.resolution_y = w, h
    s.view_settings.view_transform = 'Standard'
    s.view_settings.look = 'None'
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA'

    world = bpy.data.worlds.new('w'); s.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs[0].default_value = lin('#fff4e2'); bg.inputs[1].default_value = 0.12

    aim = bpy.data.objects.new('aim', None); s.collection.objects.link(aim); aim.location = target
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = scale
    co = bpy.data.objects.new('cam', cam); s.collection.objects.link(co); s.camera = co
    co.location = Vector(target) + Vector((9, -9, 8.2))
    t = co.constraints.new('TRACK_TO'); t.target = aim; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'

    def area(name, loc, power, size, color):
        l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.size = size; l.color = color[:3]
        o = bpy.data.objects.new(name, l); s.collection.objects.link(o); o.location = loc
        c = o.constraints.new('TRACK_TO'); c.target = aim; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    area('key', (-4, -7, 10), 1300, 7, (1, .94, .85))
    area('fill', (9, -2, 5), 620, 9, (.86, .9, 1))
    area('rim', (2, 9, 7), 650, 5, (1, .85, .6))

    return s


# ---- materials ---------------------------------------------------------------------------------

_mats = {}
def mat(name, hex_, metal=0.0, rough=0.5, emit=0.0, coat=0.0, alpha=1.0, transmit=0.0):
    key = (name, hex_, metal, rough, emit, coat, alpha, transmit)
    if key in _mats: return _mats[key]
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = lin(hex_)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Transmission Weight'].default_value = transmit
    if emit:
        p.inputs['Emission Color'].default_value = lin(hex_)
        p.inputs['Emission Strength'].default_value = emit
    if alpha < 1: p.inputs['Alpha'].default_value = alpha
    _mats[key] = m
    return m


def screen_mat(img):
    m = bpy.data.materials.new('screen-' + img); m.use_nodes = True
    n = m.node_tree.nodes; l = m.node_tree.links
    n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    tex = n.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(os.path.join(HERE, 'screens', img))
    em = n.new('ShaderNodeEmission'); em.inputs[1].default_value = 1.0
    gl = n.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = 0.08
    mix = n.new('ShaderNodeMixShader'); mix.inputs[0].default_value = 0.06
    l.new(tex.outputs[0], em.inputs[0]); l.new(em.outputs[0], mix.inputs[1]); l.new(gl.outputs[0], mix.inputs[2])
    l.new(mix.outputs[0], out.inputs[0])
    return m


GOLD = lambda: mat('gold', '#d4922a', metal=1, rough=.28)
NAVY = lambda: mat('navy', '#13233b', rough=.45, coat=.4)
CREAM = lambda: mat('cream', '#eadcc2', rough=.6)
PAPER = lambda: mat('paper', '#fffaf0', rough=.8)
RED = lambda: mat('red', '#ff3b4f', emit=9, rough=.3)
GLASS = lambda: mat('glass', '#ffffff', rough=.02, transmit=1)
GREEN = lambda: mat('green', '#25d366', rough=.35, coat=.5)
WHITE = lambda: mat('white', '#ffffff', rough=.4)


# ---- shapes ------------------------------------------------------------------------------------

def finish(o, m, bevel, segs=5):
    if LOW: segs = 2
    o.data.materials.append(m)
    if bevel:
        b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = segs; b.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    o.select_set(False)
    return o


def box(name, size, loc, m, bevel=.06, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=[math.radians(a) for a in rot])
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, bevel)


def cyl(name, r, depth, loc, m, bevel=.03, rot=(0, 0, 0), verts=64):
    if LOW: verts = 24
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=verts, location=loc, rotation=[math.radians(a) for a in rot])
    o = bpy.context.object; o.name = name
    return finish(o, m, bevel)


def sphere(name, r, loc, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=16 if LOW else 48, ring_count=8 if LOW else 24)
    o = bpy.context.object; o.name = name; o.scale = scale
    return finish(o, m, 0)


def torus(name, R, r, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=[math.radians(a) for a in rot], major_segments=36 if LOW else 72, minor_segments=8 if LOW else 18)
    o = bpy.context.object; o.name = name
    return finish(o, m, 0)


def coin(loc, tilt=0):
    if LOW: return None
    c = cyl('coin', .34, .09, loc, GOLD(), bevel=.025, rot=(tilt, 0, 0))
    torus('rim', .25, .018, (loc[0], loc[1], loc[2] + .046), GOLD())
    return c


def stack(x, y, n, z0=0):
    if LOW: return
    for i in range(n): coin((x + (i % 2) * .015, y, z0 + .05 + i * .095))


def phone(loc, yaw, img, size=1.0):
    w, d, h = .78 * size, .085 * size, 1.58 * size
    body = box('phone', (w, d, h), (0, 0, 0), NAVY(), bevel=.07 * size)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -d / 2 - .003, 0), rotation=(math.radians(90), 0, 0))
    scr = bpy.context.object; scr.scale = (w * .9, h * .93, 1); bpy.ops.object.transform_apply(scale=True)
    scr.data.materials.append(screen_mat(img))
    scr.parent = body                      # body is still at the origin, so the screen keeps its place
    body.rotation_euler = (math.radians(-6), 0, math.radians(yaw))
    body.location = loc
    return body


VIEW = Vector((9, -9, 8.2)).normalized()


RIGHT = Vector((1, 1, 0)).normalized()          # screen right, for this camera
UP = VIEW.cross(RIGHT).normalized()              # screen up
FACE = (58, 0, 45)                               # rotation that turns a disc's face to the camera


def at(c, dx, dy, out=0.0):
    """A point on the plane through c that faces the camera: dx right, dy up, `out` toward the viewer."""
    return Vector(c) + RIGHT * dx + UP * dy + VIEW * out


def rod(a, b, r, m):
    a, b = Vector(a), Vector(b)
    o = cyl('rod', r, (b - a).length, (a + b) / 2, m, bevel=.015)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (b - a).to_track_quat('Z', 'Y')
    return o


def magnifier(over, lift=1.05, size=1.0):
    """A glass between the camera and `over`: you look through it at what it found."""
    c = Vector(over) + VIEW * lift
    rot = (58, 0, 45)
    torus('lens-rim', .5 * size, .055 * size, c, GOLD(), rot=rot)
    cyl('lens', .47 * size, .015 * size, c, GLASS(), bevel=0, rot=rot)
    v = (RIGHT * .75 - UP * .66).normalized()
    rod(c + v * .55 * size, c + v * 1.25 * size, .065 * size, NAVY())


def pin(loc, s=1.0):
    sphere('pin-head', .26 * s, (loc[0], loc[1], loc[2] + .5 * s), GOLD())
    bpy.ops.mesh.primitive_cone_add(radius1=.17 * s, radius2=0, depth=.5 * s, location=(loc[0], loc[1], loc[2] + .2 * s), rotation=(math.pi, 0, 0), vertices=48)
    finish(bpy.context.object, GOLD(), 0)
    sphere('pin-dot', .1 * s, (loc[0], loc[1] - .2 * s, loc[2] + .52 * s), CREAM())


# ---- scenes ------------------------------------------------------------------------------------

def chat(c, m, r):
    """A chat bubble facing the viewer: a disc, a tail, three dots."""
    c = at(c, 0, 0, .4)
    cyl('bubble', r, .1, c, m, bevel=.04, rot=FACE)
    bpy.ops.mesh.primitive_cone_add(radius1=r * .32, depth=r * .55, vertices=32)
    t = bpy.context.object; finish(t, m, 0)
    tip = at(c, -r * .75, -r * .95); base = at(c, -r * .45, -r * .55)
    t.location = (tip + base) / 2; t.rotation_mode = 'QUATERNION'; t.rotation_quaternion = (tip - base).to_track_quat('Z', 'Y')
    for dx in (-.32, 0, .32):
        sphere('dot', r * .11, at(c, dx * r, 0, .07), WHITE())


def scene_hero():
    """Sales on the left, the bank on the right, money on three gold lanes; one lane leaks, the glass has found it."""
    reset(1400, 1000, 8.6, (0, 0, .35))
    box('ground', (7.2, 4.2, .34), (0, 0, .17), CREAM(), bevel=.16)
    # the shop: navy, a striped gold awning, a cream door
    box('shop', (1.3, 1.2, 1.05), (-2.6, .1, .86), NAVY(), bevel=.05)
    for i in range(5):
        box('awning', (.27, .5, .08), (-3.12 + i * .26, -.62, 1.25), GOLD() if i % 2 == 0 else WHITE(), bevel=.02, rot=(-22, 0, 0))
    box('door', (.36, .04, .55), (-2.6, -.5, .62), CREAM(), bevel=.02)
    # the bank: white steps and columns, a navy roof
    box('steps', (1.6, 1.4, .14), (2.55, .1, .41), WHITE(), bevel=.03)
    box('base', (1.4, 1.2, .1), (2.55, .1, .53), WHITE(), bevel=.02)
    for i in range(4):
        cyl('col', .085, .72, (2.03 + i * .345, -.38, .94), WHITE(), bevel=.01)
    box('core', (1.2, .8, .72), (2.55, .3, .94), CREAM(), bevel=.02)
    box('roof', (1.55, 1.3, .14), (2.55, .1, 1.37), WHITE(), bevel=.03)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=1.05, depth=.42, location=(2.55, .1, 1.65), rotation=(0, 0, math.radians(45)))
    o = bpy.context.object; o.scale = (1.05, .9, 1); finish(o, NAVY(), .02)
    # three lanes; the middle one is broken
    for j, y in enumerate((-.95, .1, 1.15)):
        if j == 1:
            box('lane', (1.45, .5, .06), (-1.2, y, .37), GOLD(), bevel=.025)
            box('lane', (1.45, .5, .06), (1.05, y, .37), GOLD(), bevel=.025)
        else:
            box('lane', (3.7, .5, .06), (-.08, y, .37), GOLD(), bevel=.025)
    stack(-1.5, -.95, 3, .38); stack(.5, -.95, 2, .38); stack(1.3, 1.15, 3, .38); stack(-.7, 1.15, 2, .38)
    stack(-1.55, .1, 2, .38)
    leak((-.08, .1, .345))
    magnifier((-.08, .1, .4), 1.3, 1.35)


def leak(at, size=1.0):
    """A hole lit red from inside, a coin tipping in."""
    x, y, z = at
    box('hole', (.62 * size, .5 * size, .02), (x, y, z), mat('hole', '#1a070b', rough=.9), bevel=.01)
    for i, (dx, dy) in enumerate(((-.31, 0), (.31, 0))):
        box('glow', (.04 * size, .5 * size, .03), (x + dx * size, y, z + .005), RED(), bevel=.01)
    if not LOW: sphere('drop', .07 * size, (x - .05, y - .12, z + .03), RED(), (1, 1, .5))
    l = bpy.data.lights.new('leak', 'POINT'); l.energy = 60 * size; l.color = (1, .2, .25); l.shadow_soft_size = .2
    lo = bpy.data.objects.new('leak', l); bpy.context.scene.collection.objects.link(lo); lo.location = (x, y, z + .12)
    coin((x + .1 * size, y, z + .14 * size), tilt=62)


def scene_records():
    """The records an owner already keeps: paper, a spreadsheet, a bank statement."""
    reset(1000, 900, 5.0, (.1, -.05, .25))
    for i in range(6):
        box('paper', (1.9, 1.35, .025), (0.02 * (i % 3), -.01 * i, .02 + i * .03), PAPER(), bevel=.008, rot=(0, 0, (-4 + i * 2.2)))
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, .21), rotation=(0, 0, math.radians(6)))
    s = bpy.context.object; s.scale = (1.8, 1.25, 1); bpy.ops.object.transform_apply(scale=True)
    s.data.materials.append(screen_mat('sheet.png'))
    box('book', (1.0, 1.4, .18), (1.45, .55, .09), NAVY(), bevel=.03, rot=(0, 0, -18))
    stack(-1.35, -.65, 4)
    stack(-1.0, -1.0, 2)


def scene_leak():
    """Found: one lane broken, money falling through, the glass over it."""
    reset(1000, 900, 4.3, (0, 0, .4))
    box('ground', (3.4, 2.2, .3), (0, 0, .15), CREAM(), bevel=.14)
    box('lane', (1.15, .55, .06), (-1.0, 0, .33), GOLD(), bevel=.025)
    box('lane', (1.15, .55, .06), (1.0, 0, .33), GOLD(), bevel=.025)
    stack(-1.2, 0, 3, .34); stack(1.15, 0, 2, .34)
    leak((0, 0, .305), 1.0)
    magnifier((0, 0, .35), 1.2, 1.15)


def scene_message():
    """9pm: the business in one WhatsApp message."""
    reset(900, 1000, 3.0, (0, 0, 1.0))
    phone((0, 0, 1.02), 40, 'whatsapp.png', 1.2)
    cyl('dock', .85, .08, (0, 0, .04), CREAM(), bevel=.03)
    chat(at((0, 0, 1.0), .75, .55), GREEN(), .3)


def scene_web():
    """A real client site on a phone, a WhatsApp button, a pin on the map."""
    reset(1000, 1000, 3.6, (0, 0, 1.0))
    cyl('dock', .95, .08, (0, 0, .04), CREAM(), bevel=.03)
    phone((0, 0, 1.02), 40, 'site.png', 1.2)
    chat(at((0, 0, 1.0), .78, .45), GREEN(), .34)
    pin((-.95, .25, .08), 1.0)


def scene_apps():
    """Our apps, checked before they install."""
    reset(1000, 1000, 3.6, (0, 0, 1.0))
    cyl('dock', .95, .08, (0, 0, .04), CREAM(), bevel=.03)
    phone((0, 0, 1.02), 40, 'apps.png', 1.2)
    c = at((0, 0, 1.0), .8, .45, .4)
    cyl('badge', .36, .1, c, GOLD(), bevel=.04, rot=FACE)
    a, m, b = at(c, -.15, .0, .07), at(c, -.04, -.12, .07), at(c, .16, .14, .07)
    rod(a, m, .04, WHITE()); rod(m, b, .04, WHITE())
    sphere('j', .04, m, WHITE())


def render(name):
    s = bpy.context.scene
    s.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', s.render.filepath)


def export_glb():
    """The hero, for three.js: modifiers applied, Y up, no lights or camera."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type == 'MESH': o.select_set(True)
    path = os.path.join(SITE, 'art', 'flow.glb')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_yup=True, export_lights=False, export_cameras=False, export_texcoords=False)
    print('EXPORTED', path, os.path.getsize(path))


SCENES = {'hero': scene_hero, 'records': scene_records, 'leak': scene_leak, 'message': scene_message, 'web': scene_web, 'apps': scene_apps}
for name in [a for a in sys.argv[sys.argv.index('--') + 1:] if not a.startswith('--')]:
    SCENES[name]()
    export_glb() if LOW else render(name)
