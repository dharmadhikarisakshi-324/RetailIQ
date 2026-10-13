from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal
from backend.app.models.user import User
from backend.app.core.security import hash_password


USERNAME = "admin"
EMAIL = "admin@retailiq.com"
PASSWORD = "Admin@123"
ROLE = "admin"


def create_admin():
    db: Session = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(User.username == USERNAME)
            .first()
        )

        if existing_user:
            print("Admin user already exists.")
            return

        password_hash = hash_password(PASSWORD)

        admin = User(
            username=USERNAME,
            email=EMAIL,
            password_hash=password_hash,
            role=ROLE,
            is_active=True
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin user created successfully.")
        print(f"Username: {USERNAME}")
        print(f"Password: {PASSWORD}")
        print(f"Role: {ROLE}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()