#!/usr/bin/env python3
"""Собирает index.html для GitHub Pages из src/app.html.

src/app.html — исходник страницы в том виде, в каком его принимает Артефакт
(без doctype, html, head и body: их добавляет обёртка при публикации).
Для обычного хостинга эту обёртку нужно дописать самим — этим и занят скрипт.
"""
import pathlib, re

src = pathlib.Path("src/app.html").read_text(encoding="utf-8")
i = src.index("<header")                      # всё до разметки — в head, остальное — в body
head, body = src[:i], src[i:]

DESC = "Ударение в латинской остеологической номенклатуре: 882 термина со слогоделением, транскрипцией, озвучкой и тренажёром"
FAVICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦴</text></svg>"

doc = f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{DESC}">
<meta property="og:type" content="website">
<meta property="og:title" content="Ossa Latina">
<meta property="og:description" content="{DESC}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="{FAVICON}">
<style>:root{{color-scheme:light dark}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{head.strip()}
</head>
<body>
{body.strip()}
</body>
</html>
"""
pathlib.Path("index.html").write_text(doc, encoding="utf-8")
print(f"index.html собран: {len(doc):,} байт")
