#!/usr/bin/env python3
"""Rebuilds offline-files.js: the list of files the app saves for offline use.
Run it from the project folder after adding or renaming files:  python3 tools/list-files.py
(Recipe files don't need it. The service worker reads data/recipes/index.json on its own.)"""
import os, json
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
skip_dirs = {"tools", ".git", "data/recipes", "docs"}
keep = (".html", ".css", ".js", ".json", ".svg", ".png")
files = ["./"]
for dp, dns, fns in os.walk(root):
    rel = os.path.relpath(dp, root)
    rel = "" if rel == "." else rel
    if any(rel == d or rel.startswith(d + os.sep) for d in skip_dirs):
        continue
    for f in sorted(fns):
        p = os.path.join(rel, f).replace(os.sep, "/")
        if f.endswith(keep) and p not in ("sw.js", "offline-files.js"):
            files.append(p)
files.append("data/recipes/index.json")
files = sorted(set(files), key=lambda p: (p != "./", p))
with open(os.path.join(root, "offline-files.js"), "w") as out:
    out.write("/* Files saved for offline use. Made by tools/list-files.py, so rebuild it rather than editing by hand. */\n")
    out.write("const OFFLINE_FILES = " + json.dumps(files, indent=1) + ";\n")
print(len(files), "files listed")
