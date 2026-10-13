from backend.app.database.connection import SessionLocal
from backend.app.models.user import User
from backend.app.core.security import hash_password

db = SessionLocal()

users = [
    ("staff", "staff@retailiq.com", "Staff@123", "staff"),
    ("customer", "customer@retailiq.com", "Customer@123", "customer")
]

try:
    for username, email, password, role in users:
        existing = db.query(User).filter(User.username == username).first()

        if existing:
            print(f"{username} already exists.")
        else:
            user = User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                role=role,
                is_active=True
            )
            db.add(user)
            print(f"{username} created.")

    db.commit()
finally:
    db.close()
