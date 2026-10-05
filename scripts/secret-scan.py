#!/usr/bin/env python3
"""
Pre-commit / Pre-deployment Secret Scanner
Ensures no API keys, tokens, credentials, or .env files are exposed in the repository.
"""

import os
import re
import sys

patterns = {
    'tsk_token': re.compile(r'tsk_[a-zA-Z0-9_\-]+'),
    'tripo_api_key': re.compile(r'TRIPO_API_KEY', re.IGNORECASE),
    'dot_tripo': re.compile(r'\.tripo\b', re.IGNORECASE),
    'api_key_assignment': re.compile(r'(api[_\-]?key\s*[:=]\s*["\'][a-zA-Z0-9_\-]{8,}["\'])', re.IGNORECASE),
    'bearer_token': re.compile(r'Bearer\s+[a-zA-Z0-9_\-\.]{15,}', re.IGNORECASE)
}

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
hits = []

for root, dirs, files in os.walk(root_dir):
    if any(ignored in root for ignored in ['node_modules', '.git', 'dist']):
        continue
    for d in dirs:
        if d == '.tripo' or d.startswith('.env'):
            hits.append(f"SUSPICIOUS DIRECTORY: {os.path.join(root, d)}")
    for f in files:
        if f in ['secret-scan.py', '.gitignore']:
            continue
        if f.startswith('.env') or f == '.tripo':
            hits.append(f"SUSPICIOUS FILE: {os.path.join(root, f)}")
        file_path = os.path.join(root, f)
        rel_path = os.path.relpath(file_path, root_dir)
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                for name, pat in patterns.items():
                    for m in pat.finditer(content):
                        line_no = content[:m.start()].count('\n') + 1
                        hits.append(f"MATCH [{name}] in {rel_path}:{line_no} -> {m.group(0)}")
        except Exception:
            pass

if hits:
    print(f"FAILED: Found {len(hits)} secret match(es):")
    for h in hits:
        print(f"  {h}")
    sys.exit(1)
else:
    print("PASSED: 0 secrets, API keys, or credentials found in repository.")
    sys.exit(0)
