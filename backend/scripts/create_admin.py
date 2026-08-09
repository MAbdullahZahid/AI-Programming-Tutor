"""
Interactive terminal script to create THE single admin account.

Run from the backend/ folder (after `flask db upgrade` has created the tables):

    python scripts/create_admin.py

This script:
  - Refuses to run if an admin already exists (only 1 admin allowed, ever).
  - Prompts for name, email and a hidden (masked) password.
  - Confirms the password before creating the account.
"""

import sys
import os
import getpass

# Allow running this script directly from backend/scripts/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import db
from app.models.user import User


def main():
    app = create_app()

    with app.app_context():
        if User.admin_exists():
            existing = User.query.filter_by(role="admin").first()
            print(f"An admin account already exists: {existing.email}")
            print("Only one admin is allowed. Aborting.")
            sys.exit(1)

        print("=== Create Admin Account ===")
        full_name = input("Full name: ").strip()
        email = input("Email: ").strip()

        if not full_name or not email:
            print("Name and email are required. Aborting.")
            sys.exit(1)

        if User.query.filter_by(email=email).first():
            print(f"Error: an account with email '{email}' already exists.")
            sys.exit(1)

        while True:
            password = getpass.getpass("Password (min 6 chars): ")
            confirm = getpass.getpass("Confirm password: ")

            if password != confirm:
                print("Passwords do not match. Try again.\n")
                continue
            if len(password) < 6:
                print("Password must be at least 6 characters. Try again.\n")
                continue
            break

        admin = User(full_name=full_name, email=email, role="admin")
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()

        print(f"\nAdmin account created successfully for '{email}'.")
        print("You can now log in from the frontend with these credentials.")


if __name__ == "__main__":
    main()
