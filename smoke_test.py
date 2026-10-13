from playwright.sync_api import sync_playwright
import os, sys

OUT = os.path.join(os.environ.get("TEMP", r"C:\Temp"), "opencode", "qbo-smoke")
os.makedirs(OUT, exist_ok=True)

SECTIONS = ["Overview", "Pipeline", "Proyectos", "Contactos", "Customers", "Team", "Forecasting", "Reports", "Settings"]

logs = []
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle", timeout=30000)

    # Login si aparece AuthScreen (qbomodular / admin123 seed)
    try:
        user = page.get_by_placeholder("Usuario (ej aquintero)")
        pwd = page.get_by_placeholder("Contraseña")
        if user.count() > 0:
            user.fill("qbomodular")
            pwd.fill("admin123")
            page.get_by_role("button", name="Entrar").click()
            page.wait_for_load_state("networkidle", timeout=30000)
            page.wait_for_timeout(1500)
    except Exception as e:
        print(f"login-step: {e}")

    page.screenshot(path=os.path.join(OUT, "00-login-state.png"), full_page=True)

    for i, name in enumerate(SECTIONS, start=1):
        try:
            btn = page.get_by_role("button", name=name).first
            if btn.count() == 0:
                btn = page.locator(f"text={name}").first
            btn.click(timeout=5000)
            page.wait_for_timeout(1200)
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception as e:
            print(f"[{name}] nav fail: {e}")
        shot = os.path.join(OUT, f"{i:02d}-{name}.png")
        try:
            page.screenshot(path=shot, full_page=True)
            print(f"[{name}] ok -> {shot}")
        except Exception as e:
            print(f"[{name}] screenshot fail: {e}")

    print("--- CONSOLE (last 40) ---")
    for l in logs[-40:]:
        print(l)
    print(f"--- PAGE ERRORS: {len(errors)} ---")
    for e in errors[:20]:
        print(e)
    print(f"OUT={OUT}")
    browser.close()
