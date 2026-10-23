"""
AI Programming Tutor — Selenium Test Script
CSC418 DevOps Lab Mid Assignment | Task 6

Tests the deployed web application by:
  1. Opening the app homepage
  2. Verifying the page title
  3. Detecting a key UI element (heading)
  4. Navigating to the Login page
  5. Verifying the login form exists

Usage:
  pip install selenium webdriver-manager
  python selenium_test.py [APP_URL]

  Default APP_URL = http://localhost
  For EC2 deployment: python selenium_test.py http://<EC2-PUBLIC-IP>
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
options.add_argument("--headless")            # run without opening browser window
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1280,720")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options,
)
wait = WebDriverWait(driver, 15)

passed = 0
failed = 0


def test(name, fn):
    """Helper to run a single test case and track results."""
    global passed, failed
    try:
        fn()
        print(f"  ✅ PASS — {name}")
        passed += 1
    except Exception as e:
        print(f"  ❌ FAIL — {name}: {e}")
        failed += 1


# ── Tests ────────────────────────────────────────────────────────────────
print(f"\n{'='*55}")
print(f"  AI Programming Tutor — Selenium Test Suite")
print(f"  Target: {APP_URL}")
print(f"{'='*55}\n")

# Test 1: Homepage loads
def t1():
    driver.get(APP_URL)
    time.sleep(2)
    assert driver.title != "", f"Expected a page title, got empty string"
    print(f"     Title: '{driver.title}'")
test("Homepage loads and has a title", t1)

# Test 2: Page title contains expected text
def t2():
    assert "AI" in driver.title or "Tutor" in driver.title or "Programming" in driver.title, \
        f"Title '{driver.title}' does not contain expected keywords"
test("Page title contains 'AI' or 'Tutor'", t2)

# Test 3: Main heading/element present
def t3():
    element = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, "h1"))
    )
    assert element.is_displayed(), "h1 element is not visible"
    print(f"     Heading: '{element.text}'")
test("Main heading (h1) is visible on homepage", t3)

# Test 4: Navigate to Login page
def t4():
    driver.get(f"{APP_URL}/login")
    time.sleep(2)
    assert driver.current_url.endswith("/login") or "login" in driver.current_url, \
        f"Did not navigate to login page. Current URL: {driver.current_url}"
test("Navigation to /login page works", t4)

# Test 5: Login form is present
def t5():
    form = wait.until(
        EC.presence_of_element_located((By.TAG_NAME, "form"))
    )
    assert form.is_displayed(), "Login form is not visible"
test("Login form is present on /login page", t5)

# Test 6: Email input field exists
def t6():
    email_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='email']"))
    )
    assert email_input.is_displayed(), "Email input not visible"
test("Email input field exists in login form", t6)

# Test 7: Password input field exists
def t7():
    pwd_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    assert pwd_input.is_displayed(), "Password input not visible"
test("Password input field exists in login form", t7)

# ── Results ──────────────────────────────────────────────────────────────
driver.quit()

print(f"\n{'='*55}")
print(f"  Results: {passed} passed, {failed} failed out of {passed+failed} tests")
if failed == 0:
    print("  🎉 ALL TESTS PASSED!")
else:
    print("  ⚠️  Some tests failed — check app is running at the target URL.")
print(f"{'='*55}\n")

