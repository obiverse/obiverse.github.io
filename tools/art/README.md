# Illustrations

Blender renders with transparent backgrounds; the page adds their shadow (`.ill` in studio.css).

```sh
sh tools/art/screens.sh                                            # photograph the phone screens (Chrome)
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P tools/art/build.py -- hero leak records message web apps
sh tools/art/ship.sh                                               # → art/<name>-960.webp and -480.webp
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P tools/art/build.py -- hero --glb   # → art/flow.glb
(cd tools/art/hero && npm install && npm run build)                # → js/hero.js (three.js, the live home hero)
```

One camera, one light, one palette (navy, gold, cream) for every scene. The live hero uses the same camera as
the still, so the still is its poster; labels on it are placed by projecting their 3D points (`data-at`).
