import pandas as pd
from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal
from backend.app.models.customer import Customer


CSV_PATH = r"D:\AI-Retail-Intelligence\ml\data\processed\customer_rfm.csv"


def seed_customers():
    df = pd.read_csv(CSV_PATH)

    # Convert Customer ID from float to integer
    df["Customer ID"] = df["Customer ID"].astype(int)

    db: Session = SessionLocal()

    try:
        inserted = 0
        skipped = 0

        for ml_id in df["Customer ID"].unique():

            # Check whether this ML customer already exists
            existing = (
                db.query(Customer)
                .filter(Customer.ml_customer_id == ml_id)
                .first()
            )

            if existing:
                skipped += 1
                continue

            customer = Customer(
                customer_code=f"C{ml_id}",
                ml_customer_id=ml_id,
                name=f"Customer {ml_id}",
                email=None,
                phone=None,
                loyalty_member=False,
                is_active=True,
            )

            db.add(customer)
            inserted += 1

        db.commit()

        print("Customer seeding completed.")
        print(f"Inserted: {inserted}")
        print(f"Skipped:  {skipped}")

    except Exception as e:
        db.rollback()
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_customers()