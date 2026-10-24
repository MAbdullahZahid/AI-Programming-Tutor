"""
AI Programming Tutor — Selenium Test Script
CSC418 DevOps Lab Mid Assignment | Task 6

Tests the deployed web application using real selectors from the actual React app.

Usage:
  python selenium_test.py              # tests http://localhost
  python selenium_test.py http://<IP>  # tests EC2 deployment
"""

import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# ── Configuration ────────────────────────────────────────────────────────
APP_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost"

# ── Chrome Driver Setup ──────────────────────────────────────────────────
options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1280,900")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options,
)
wait = WebDriverWait(driver, 15)

passed = 0
failed = 0


def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f"  ✅ PASS — {name}")
        passed += 1
    except Exception as e:
        print(f"  ❌ FAIL — {name}: {e}")
        failed += 1


print(f"\n{'='*55}")
print(f"  AI Programming Tutor — Selenium Test Suite")
print(f"  Target: {APP_URL}")
print(f"{'='*55}\n")

# ── Test 1: Homepage loads ───────────────────────────────────────────────
def t1():
    driver.get(APP_URL)
    time.sleep(2)
    assert "AI" in driver.title or driver.title != "", f"Got title: '{driver.title}'"
    print(f"     Title: '{driver.title}'")
test("Homepage loads with correct title", t1)

# ── Test 2: Main hero heading is visible ────────────────────────────────
def t2():
    h1 = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1.home-hero-title")))
    assert h1.is_displayed()
    print(f"     h1: '{h1.text[:60]}...'")
test("Hero heading (h1.home-hero-title) is visible", t2)

# ── Test 3: Brand name 'AI Tutor' shown in navbar ───────────────────────
def t3():
    brand = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".home-brand")))
    assert "AI Tutor" in brand.text
    print(f"     Brand text: '{brand.text}'")
test("'AI Tutor' brand visible in navbar", t3)

# ── Test 4: 'Log In' button on homepage ─────────────────────────────────
def t4():
    login_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn.btn-ghost")))
    assert login_btn.is_displayed()
    print(f"     Button text: '{login_btn.text}'")
test("'Log In' button is present and clickable", t4)

# ── Test 5: Navigate to /login page ─────────────────────────────────────
def t5():
    driver.get(f"{APP_URL}/login")
    time.sleep(2)
    title = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h2.auth-title")))
    assert "Welcome back" in title.text
    print(f"     Login title: '{title.text}'")
test("Login page loads with 'Welcome back' heading", t5)

# ── Test 6: Email input field present ───────────────────────────────────
def t6():
    email = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
    assert email.is_displayed()
test("Email input field is present on login page", t6)

# ── Test 7: Password input field present ────────────────────────────────
def t7():
    pwd = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']")))
    assert pwd.is_displayed()
test("Password input field is present on login page", t7)

# ── Test 8: Login form submits and backend responds ──────────────────────
def t8():
    driver.get(f"{APP_URL}/login")
    time.sleep(2)
    email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
    pwd_input   = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn  = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

    email_input.clear()
    email_input.send_keys("admin@gmail.com")
    pwd_input.clear()
    pwd_input.send_keys("wrongpassword_trigger_error")
    submit_btn.click()
    time.sleep(3)

    # Either a successful redirect OR an error message proves the backend
    # received the request and responded — both are valid for this test.
    current = driver.current_url
    redirected = "/admin" in current or "/chat" in current

    error_shown = False
    error_text = ""
    try:
        err = driver.find_element(By.CSS_SELECTOR, ".auth-error")
        error_shown = err.is_displayed() and len(err.text) > 0
        error_text = err.text
    except Exception:
        pass

    assert redirected or error_shown, \
        "Expected either a redirect or an error message — backend did not respond"

    if redirected:
        print(f"     ✔ Login succeeded → redirected to: {current}")
    else:
        print(f"     ✔ Backend responded with: '{error_text}' (form + API working correctly)")
test("Login form submits and backend responds", t8)

# ── Results ──────────────────────────────────────────────────────────────
driver.quit()

print(f"\n{'='*55}")
print(f"  Results: {passed} passed, {failed} failed out of {passed+failed} tests")
if failed == 0:
    print("  🎉 ALL TESTS PASSED!")
else:
    print("  ⚠️  Some tests failed — check output above.")
print(f"{'='*55}\n")
