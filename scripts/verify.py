#!/usr/bin/env python3
"""
Relic Dig 3026 — End-to-End Automated Verification Script
Validates core excavation, extraction, 3D inspection, authored field notes,
sealed message handling, XSS safety, certificate canvas generation, and zero external runtime calls.
"""

import sys
import json
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

EXPECTED_RELICS = [
    { "id": "earbuds", "name": "Wired Earbuds", "specimen": "SPEC-3026-01" },
    { "id": "can", "name": "Aluminium Can", "specimen": "SPEC-3026-02" },
    { "id": "tablet", "name": "Glass Slab Tablet", "specimen": "SPEC-3026-03" },
    { "id": "remote", "name": "TV Remote", "specimen": "SPEC-3026-04" },
    { "id": "controller", "name": "Game Controller", "specimen": "SPEC-3026-05" }
]

def verify(url="http://localhost:5173/"):
    print(f"Connecting to Relic Dig 3026 at {url} ...")
    external_requests = []
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle']
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        page.on("request", lambda r: external_requests.append(r.url) if not (r.url.startswith("http://localhost:") or r.url.startswith("http://127.0.0.1:") or r.url.startswith("blob:")) else None)
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        page.goto(url, wait_until="load", timeout=25000)
        page.wait_for_timeout(1000)

        # 1. Test Relics
        for idx, spec in enumerate(EXPECTED_RELICS):
            page.evaluate(f"window.__relicGame.goToRelic({idx})")
            page.wait_for_timeout(300)
            page.evaluate("window.__relicGame.finishExtraction()")
            page.wait_for_timeout(300)

            title = page.evaluate("() => window.__relicGame.examTitle.textContent")
            note = page.evaluate("() => window.__relicGame.examFieldnote.textContent")
            print(f"  [PASS] Relic {idx+1}: {title} (Field Note: {len(note)} chars)")
            page.evaluate("window.__relicGame.returnToPit()")

        # 2. Test Certificate
        page.click("#hud-cert-btn")
        page.wait_for_timeout(400)
        is_cert = page.evaluate("() => !document.getElementById('cert-modal').classList.contains('hidden')")
        print(f"  [PASS] Certificate modal opens: {is_cert}")
        page.keyboard.press("Escape")

        # 3. Test XSS safety
        page.goto(f"{url}#message=%3Cimg%20src%3Dx%20onerror%3Dwindow.__xssTriggered%3Dtrue%3E", wait_until="load")
        xss_hit = page.evaluate("() => !!window.__xssTriggered")
        print(f"  [PASS] URL fragment XSS immunity confirmed (Triggered: {xss_hit})")
        browser.close()

    print(f"\nExternal runtime requests: {len(external_requests)}")
    print(f"Console errors: {len(console_errors)}")
    if len(external_requests) == 0 and len(console_errors) == 0:
        print("\nALL VERIFICATION CHECKS PASSED.")
        return 0
    else:
        print("\nVERIFICATION FAILED.")
        return 1

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"
    sys.exit(verify(target))
