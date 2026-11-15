#!/usr/bin/env python3
"""Rebuilds data/recipes.json, a backup copy of every recipe in one file.
The app uses it to fill in any recipe file that fails to load.
Run from the project folder after adding recipes:  python3 tools/build-recipe-bundle.py"""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = os.path.join(root, "data", "recipes")
files = json.load(open(os.path.join(d, "index.json")))
recipes = [json.load(open(os.path.join(d, f), encoding="utf8")) for f in files]
with open(os.path.join(root, "data", "recipes.json"), "w", encoding="utf8") as out:
    out.write(json.dumps(recipes, ensure_ascii=False, separators=(",", ":")) + "\n")
print(len(recipes), "recipes bundled")
