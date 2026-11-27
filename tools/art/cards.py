"""Share cards: the picture people see when a page is sent on WhatsApp, LinkedIn or X (1200x630 JPEG).

    python3 tools/art/cards.py            -> art/og/<name>.jpg for every card below

Each card is the page's own Blender render, its headline and one line that sells it, on the brand's navy.
Uses the full-size renders in tools/art/out (rebuild them first if that folder is empty).
"""
import os, subprocess, html

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(SITE, 'art', 'og')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
N = '₦'

CARDS = {
    # name: (render, eyebrow, headline, chip)
    'home': ('hero', 'Obiverse · Kwatasoft', 'Every penny has an address.', 'FlowLedger · Websites · Apps'),
    'flowledger': ('hero', 'FlowLedger', 'Know where every kilogram and every naira went.', f'Leak diagnostic {N}100,000'),
    'websites': ('web', 'Website design', 'A website that brings you customers.', f'From {N}400,000 · live in 7 days'),
    'website-cost': ('price', 'Website prices, 2026', 'How much does a website cost in Nigeria?', f'{N}400,000 · {N}800,000 · {N}25,000 a month'),
    'calabar': ('case-ogaplastic', 'Calabar & Cross River', 'A website for your Calabar business.', f'Live in 7 days · from {N}400,000'),
    'month-end-leaks': ('leak', 'For manufacturers & distributors', 'Stock, sales and bank don’t match?', 'Six checks you can do this week'),
    'ogaplastic': ('case-ogaplastic', 'Our work · Nigeria', 'The website that sells OGA PLASTIC’s water tanks.', 'ogaplastic.com · built by Obiverse'),
    'arteduxcel': ('case-arteduxcel', 'Our work · Africa', 'Quote requests from across Africa.', 'arteduxcel.com · built by Obiverse'),
    'jawacard': ('case-jawacard', 'Our work · Cameroon', 'The platform behind a bilingual fuel card.', 'jawacard.com · platform by Obiverse'),
    'apps': ('apps', 'Obiverse Apps', 'Our apps. One place.', 'Android & iPhone · free'),
}

PAGE = '''<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=IBM+Plex+Sans:wght@600&display=swap" rel="stylesheet">
<style>
html,body{{margin:0;width:1200px;height:630px;overflow:hidden}}
body{{background:radial-gradient(70% 90% at 80% 20%,rgba(201,125,29,.22),transparent 60%),#0a1628;color:#f0e4cc;font-family:Rajdhani,sans-serif}}
.l{{position:absolute;left:72px;top:70px;width:560px}}
.mark{{display:flex;align-items:center;gap:14px;color:#c97d1d;font:700 24px Rajdhani;letter-spacing:.3em}}
.mark img{{width:34px;height:34px}}
.eb{{margin-top:54px;color:#c97d1d;font:700 20px Rajdhani;letter-spacing:.22em;text-transform:uppercase}}
h1{{margin:14px 0 0;font:700 {size}px/1.04 Rajdhani;letter-spacing:-.01em}}
.chip{{position:absolute;left:72px;bottom:66px;font:600 22px 'IBM Plex Sans';padding:14px 22px;border-radius:99px;background:#c97d1d;color:#0a1628}}
.art{{position:absolute;right:-20px;top:50%;transform:translateY(-50%);width:600px;height:560px;display:grid;place-items:center}}
.art img{{max-width:600px;max-height:540px;filter:drop-shadow(0 30px 34px rgba(0,0,0,.55))}}
</style>
<div class="l"><div class="mark"><img src="file://{site}/logo-192.png">OBIVERSE</div><div class="eb">{eb}</div><h1>{h1}</h1></div>
<div class="chip">{chip}</div>
<div class="art"><img src="file://{render}"></div>'''

os.makedirs(OUT, exist_ok=True)
for name, (render, eb, h1, chip) in CARDS.items():
    src = os.path.join(HERE, 'out', render + '.png')
    size = 72 if len(h1) < 34 else 62 if len(h1) < 48 else 54
    page = os.path.join(HERE, 'out', f'card-{name}.html')
    open(page, 'w').write(PAGE.format(site=SITE, render=src, eb=html.escape(eb), h1=html.escape(h1), chip=html.escape(chip), size=size))
    png = os.path.join(HERE, 'out', f'card-{name}.png')
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    '--virtual-time-budget=5000', '--window-size=1200,630', f'--screenshot={png}', 'file://' + page],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    jpg = os.path.join(OUT, name + '.jpg')
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', png, '--out', jpg], stdout=subprocess.DEVNULL, check=True)
    print(f'{name:16} {os.path.getsize(jpg) // 1024}K')
