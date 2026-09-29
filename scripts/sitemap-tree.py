# -*- coding: utf-8 -*-
"""Дерево маршрутов Relaxic: от главной до конечных страниц.

Рисуем SVG руками, без graphviz: нужен контроль над шиной слияния
(все страницы-витрины ведут в одну карточку товара) и над фирменными цветами.
Раскладка — классическая аккуратная: лист получает следующую строку,
родитель встаёт посередине между первым и последним ребёнком.
"""
import html, json, pathlib

INK, INK2, INK3 = "#141110", "#1E1917", "#2A2321"
CANVAS, FOG = "#F6F1E8", "#9A9088"
SURIK, AMETHYST, TURQUOISE, OCHRE = "#E8482B", "#9D86D7", "#1FB8A0", "#E9B949"

# ── Дерево ───────────────────────────────────────────────────
# (заголовок, url, вид, цвет, [дети])   вид: page | hub | group | info
def N(title, url, kind="page", tone=None, kids=None, buy=False):
    return {"t": title, "u": url, "k": kind, "tone": tone, "kids": kids or [], "buy": buy}

TREE = N("Главная", "/", "hub", CANVAS, [
    N("Каталог", "/catalog", "hub", SURIK, [
        N("Картины по номерам", "/catalog/kartiny-po-nomeram", tone=SURIK, buy=True),
        N("Алмазные мозаики", "/catalog/almaznaya-mozaika", tone=SURIK, buy=True),
        N("Вышивка крестиком", "/catalog/vyshivka-krestikom", tone=SURIK, buy=True),
    ]),
    N("Вселенные", "/fandom", "hub", SURIK, [
        N("Гарри Поттер", "/fandom/harry-potter", tone=SURIK, buy=True),
        N("Марвел", "/fandom/marvel", tone=SURIK, buy=True),
        N("Игра престолов", "/fandom/game-of-thrones", tone=SURIK, buy=True),
        N("Звёздные войны", "/fandom/star-wars", tone=SURIK, buy=True),
        N("Киберпанк", "/fandom/cyberpunk", tone=SURIK, buy=True),
        N("Аниме", "/fandom/anime", tone=SURIK, buy=True),
        N("Аниме-классика", "/fandom/studio-ghibli", tone=SURIK, buy=True),
        N("Ретро-игры", "/fandom/retro-games", tone=SURIK, buy=True),
        N("Культовое кино", "/fandom/cult-cinema", tone=SURIK, buy=True),
    ]),
    N("Подобрать за 3 вопроса", "/quiz", tone=SURIK, buy=True),
    N("Подарки", "/gifts", "hub", SURIK, [
        N("Детям", "/gifts/for-kids", tone=SURIK, buy=True),
        N("Ей", "/gifts/for-her", tone=SURIK, buy=True),
        N("Ему", "/gifts/for-him", tone=SURIK, buy=True),
        N("До 2 000 ₽", "/gifts/under-2000", tone=SURIK, buy=True),
        N("Подарочный сертификат", "/gifts/certificate", "info", SURIK),
        N("Подарочная упаковка", "/gifts/packaging", "info", SURIK),
    ]),
    N("Как это работает", "/how-it-works", "hub", TURQUOISE, [
        N("Картины по номерам", "/how-it-works/paint-by-numbers", tone=TURQUOISE),
        N("Алмазная мозаика", "/how-it-works/diamond-mosaic", tone=TURQUOISE),
        N("Вышивка крестиком", "/how-it-works/cross-stitch", tone=TURQUOISE),
    ]),
    N("Блог", "/blog", "hub", AMETHYST, [
        N("6 рубрик: вселенные, мастерская, истории,\nподарки, спокойствие, изнанка",
          None, "info", AMETHYST),
        N("Статья", "/blog/[slug]", tone=AMETHYST),
    ]),
    N("Галерея работ", "/gallery", tone=AMETHYST),
    N("Отзывы", "/reviews", tone=AMETHYST),
    N("Своя картина", "/custom", tone=AMETHYST),
    N("Служебные · подвал", None, "group", FOG, [
        N("О нас", "/about", tone=FOG),
        N("Доставка и оплата", "/delivery", tone=FOG),
        N("Контакты", "/contacts", tone=FOG),
        N("Вопросы и ответы", "/faq", tone=FOG),
    ]),
    N("Поиск · иконка в шапке", "/search", tone=FOG),
    N("Юридические · подвал", None, "group", FOG, [
        N("Политика обработки данных", "/legal/privacy", tone=FOG),
        N("Публичная оферта", "/legal/offer", tone=FOG),
        N("Файлы cookie", "/legal/cookies", tone=FOG),
    ]),
    # Страница есть, ссылок на неё нет ни в шапке, ни в подвале — так и рисуем.
    N("Кабинет · демо, ссылок нет", "/account", "info", FOG),
])

# Воронка покупки — общий ствол, в который сходятся все витрины
FUNNEL = [
    N("Карточка товара", "/product/[slug]", tone=OCHRE),
    N("Корзина", "/cart", tone=OCHRE),
    N("Оформление", "/checkout", tone=OCHRE),
    N("Заказ принят", "/order/[номер]", tone=OCHRE),
]

# ── Раскладка ────────────────────────────────────────────────
# Зазор между колонками = COL_W - NODE_W. Было 34px, и на изогнутой связи
# последний горизонтальный отрезок получался отрицательным — стрелка
# разворачивалась назад. Нужно место под два скругления по 12px.
COL_W, NODE_W, ROW, PAD_L, PAD_T = 352, 280, 58, 64, 250
row = [0]

def layout(n, depth=0):
    n["col"] = depth
    if n["kids"]:
        for k in n["kids"]:
            layout(k, depth + 1)
        n["y"] = (n["kids"][0]["y"] + n["kids"][-1]["y"]) / 2
    else:
        n["y"] = row[0] * ROW
        row[0] += 1
    return n

layout(TREE)

def walk(n, acc=None):
    acc = acc if acc is not None else []
    acc.append(n)
    for k in n["kids"]:
        walk(k, acc)
    return acc

nodes = walk(TREE)
maxcol = max(n["col"] for n in nodes)
BUS_X = PAD_L + (maxcol + 1) * COL_W - 18          # вертикальная шина слияния
for i, f in enumerate(FUNNEL):
    f["col"] = maxcol + 1 + i
    f["y"] = None                                   # проставим после расчёта высоты

buyers = [n for n in nodes if n["buy"]]
bus_top, bus_bot = min(b["y"] for b in buyers), max(b["y"] for b in buyers)
for i, f in enumerate(FUNNEL):
    f["y"] = (bus_top + bus_bot) / 2

H = PAD_T + row[0] * ROW + 190
W = PAD_L + (maxcol + 1 + len(FUNNEL)) * COL_W + 40

def x_of(n): return PAD_L + n["col"] * COL_W
def y_of(n): return PAD_T + n["y"]
NH = 50

out = []
def esc(s): return html.escape(s, quote=False)

# ── Связи ────────────────────────────────────────────────────
for n in nodes:
    for k in n["kids"]:
        x1, y1 = x_of(n) + NODE_W, y_of(n) + NH / 2
        x2, y2 = x_of(k), y_of(k) + NH / 2
        mx = x1 + (COL_W - NODE_W) / 2
        r = 12
        if abs(y1 - y2) < 1:
            d = f"M{x1} {y1} H{x2 - 8}"
        else:
            sgn = 1 if y2 > y1 else -1
            d = (f"M{x1} {y1} H{mx - r} Q{mx} {y1} {mx} {y1 + sgn * r} "
                 f"V{y2 - sgn * r} Q{mx} {y2} {mx + r} {y2} H{x2 - 8}")
        col = k["tone"] or FOG
        out.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".45" '
                   f'stroke-width="1.6" marker-end="url(#a-{col[1:]})"/>')

# ── Шина слияния в карточку товара ───────────────────────────
out.append(f'<path d="M{BUS_X} {PAD_T + bus_top + NH/2} V{PAD_T + bus_bot + NH/2}" '
           f'stroke="{OCHRE}" stroke-opacity=".55" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
for b in buyers:
    out.append(f'<path d="M{x_of(b) + NODE_W} {y_of(b) + NH/2} H{BUS_X}" '
               f'stroke="{OCHRE}" stroke-opacity=".38" stroke-width="1.4" fill="none"/>')
    out.append(f'<circle cx="{BUS_X}" cy="{y_of(b) + NH/2}" r="3" fill="{OCHRE}" fill-opacity=".8"/>')
card = FUNNEL[0]
out.append(f'<path d="M{BUS_X} {y_of(card) + NH/2} H{x_of(card) - 8}" stroke="{OCHRE}" '
           f'stroke-width="2.4" fill="none" marker-end="url(#a-{OCHRE[1:]})"/>')
for a, b in zip(FUNNEL, FUNNEL[1:]):
    out.append(f'<path d="M{x_of(a) + NODE_W} {y_of(a) + NH/2} H{x_of(b) - 8}" stroke="{OCHRE}" '
               f'stroke-width="2.4" fill="none" marker-end="url(#a-{OCHRE[1:]})"/>')

# ── Узлы ─────────────────────────────────────────────────────
def node_svg(n):
    x, y = x_of(n), y_of(n)
    tone = n["tone"] or FOG
    k = n["k"]
    if k == "group":
        fill, stroke, dash, tw = "none", tone, ' stroke-dasharray="5 4"', 600
    elif k == "hub":
        fill, stroke, dash, tw = INK2, tone, "", 700
    elif k == "info":
        fill, stroke, dash, tw = "none", tone, ' stroke-dasharray="3 3"', 500
    else:
        fill, stroke, dash, tw = INK2, INK3, "", 500
    s = [f'<rect x="{x}" y="{y}" width="{NODE_W}" height="{NH}" rx="10" fill="{fill}" '
         f'stroke="{stroke}" stroke-opacity="{0.9 if k in ("hub","group","info") else 1}" stroke-width="1.4"{dash}/>']
    if k == "hub":
        s.append(f'<rect x="{x}" y="{y}" width="4" height="{NH}" rx="2" fill="{tone}"/>')
    lines = n["t"].split("\n")
    ty = y + (19 if len(lines) == 1 and n["u"] else (18 if len(lines) > 1 else 31))
    if len(lines) == 1:
        s.append(f'<text x="{x+16}" y="{ty+6}" font-family="Rubik, Arial, sans-serif" font-size="14.5" font-weight="{tw}" '
                 f'fill="{CANVAS if k!="group" else tone}">{esc(lines[0])}</text>')
    else:
        for i, ln in enumerate(lines):
            s.append(f'<text x="{x+16}" y="{ty + 2 + i*15}" font-family="Onest, Arial, sans-serif" font-size="11.5" '
                     f'fill="{tone}" fill-opacity=".92">{esc(ln)}</text>')
    if n["u"]:
        s.append(f'<text x="{x+16}" y="{y+40}" font-family="Onest, Arial, sans-serif" font-size="11.5" '
                 f'fill="{FOG}">{esc(n["u"])}</text>')
    return "".join(s)

for n in nodes + FUNNEL:
    out.append(node_svg(n))

markers = "".join(
    f'<marker id="a-{c[1:]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" '
    f'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{c}" fill-opacity=".75"/></marker>'
    for c in (SURIK, AMETHYST, TURQUOISE, OCHRE, FOG, CANVAS))

PANEL_X = PAD_L + (maxcol + 1) * COL_W + 8
PANEL_Y = PAD_T + bus_bot + 150
PANEL_W = W - PANEL_X - 40
def panel_block(title, rows, y, tone):
    o = [f'<text x="{PANEL_X}" y="{y}" font-family="Rubik, Arial, sans-serif" font-size="17" '
         f'font-weight="700" fill="{tone}">{esc(title)}</text>']
    for i, r in enumerate(rows):
        o.append(f'<text x="{PANEL_X}" y="{y + 30 + i*24}" font-family="Onest, Arial, sans-serif" '
                 f'font-size="14.5" fill="{CANVAS}" fill-opacity=".72">{esc(r)}</text>')
    return "".join(o), y + 30 + len(rows) * 24 + 34

y = PANEL_Y
b1, y = panel_block("Четыре входа в покупку", [
    "Каталог — знает технику",
    "Вселенные — знает героя",
    "Подбор за 3 вопроса — не знает ничего",
    "Подарки — выбирает не себе",
], y, SURIK)
b2, y = panel_block("Не индексируется", [
    "/cart · /checkout · /order/[номер]",
    "/account · /search",
    "Фасеты каталога: noindex, follow",
    "",
    "Корзина открывается ещё и иконкой в шапке,",
    "с любой страницы сайта.",
    "Страница-сирота: /account — ссылок на неё",
    "нет нигде, её либо связать, либо убрать.",
], y, FOG)
b3, y = panel_block("Правило перелинковки", [
    "У каждой страницы минимум три входящие",
    "и три исходящие ссылки. Четыре слоя:",
    "ссылки в тексте · смысловые мосты ·",
    "хлебные крошки · карта в подвале.",
], y, TURQUOISE)
out.append(f'<path d="M{PANEL_X - 28} {PANEL_Y - 34} V{y - 46}" stroke="{INK3}" stroke-width="1.5"/>')
out.append(b1 + b2 + b3)

legend = [("Коммерция — путь к покупке", SURIK), ("Помощь выбрать", TURQUOISE),
          ("Контент и доверие", AMETHYST), ("Воронка покупки", OCHRE), ("Служебное", FOG)]
leg = []
lx = PAD_L
for t, c in legend:
    leg.append(f'<circle cx="{lx+6}" cy="{H-72}" r="5.5" fill="{c}"/>')
    leg.append(f'<text x="{lx+20}" y="{H-67}" font-family="Onest, Arial, sans-serif" font-size="13.5" fill="{FOG}">{esc(t)}</text>')
    lx += 34 + len(t) * 8.2
leg.append(f'<text x="{PAD_L}" y="{H-36}" font-family="Onest, Arial, sans-serif" font-size="13" fill="{FOG}" fill-opacity=".75">'
           'Пунктир — страница без витрины товаров. Точки на жёлтой линии — каждая витрина ведёт в одну и ту же карточку товара.</text>')

head = f'''
<text x="{PAD_L}" y="96" font-family="Rubik, Arial, sans-serif" font-size="52" font-weight="800" fill="{CANVAS}" letter-spacing="-1.6">RELAXIC</text>
<path d="M{PAD_L+262} 68 l30 30 M{PAD_L+292} 68 l-30 30" stroke="{SURIK}" stroke-width="7" stroke-linecap="round"/>
<text x="{PAD_L+320}" y="96" font-family="Onest, Arial, sans-serif" font-size="21" fill="{FOG}">карта сайта · дерево путей от главной до конечных страниц</text>
<text x="{PAD_L}" y="146" font-family="Onest, Arial, sans-serif" font-size="16" fill="{FOG}" fill-opacity=".8">{len(nodes)+len(FUNNEL)} узлов · {row[0]} конечных страниц · стрелка = переход по ссылке на сайте</text>
<path d="M{PAD_L} 178 H{W-PAD_L}" stroke="{INK3}" stroke-width="1.5"/>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{markers}</defs>
<rect width="{W}" height="{H}" fill="{INK}"/>
{head}
{"".join(out)}
{"".join(leg)}
</svg>'''

d = pathlib.Path(__file__).resolve().parent.parent / "docs" / "assets"
(d / "sitemap-tree.svg").write_text(svg, encoding="utf-8")
print(f"размер холста {W}×{H}, узлов {len(nodes)+len(FUNNEL)}, конечных строк {row[0]}")
