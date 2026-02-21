from playwright.sync_api import sync_playwright

def verify(page):
    try:
        page.goto("http://localhost:3000/en")
        page.wait_for_timeout(5000) # Wait for hydration and potential error rendering
        page.screenshot(path="verification/dashboard.png", full_page=True)
        print("Screenshot taken")
    except Exception as e:
        print(f"Error: {e}")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify(page)
    browser.close()
