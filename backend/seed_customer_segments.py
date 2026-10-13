import pandas as pd
from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal
from backend.app.models.customer import Customer
from backend.app.models.customer_segments import CustomerSegment


CSV_PATH = r"D:\AI-Retail-Intelligence\ml\data\processed\customer_ml_segments.csv"


def seed_customer_segments():
    df = pd.read_csv(CSV_PATH)

    # Convert ML Customer ID to integer
    df["Customer ID"] = df["Customer ID"].astype(int)

    db: Session = SessionLocal()

    try:
        inserted = 0
        skipped = 0

        for _, row in df.iterrows():

            ml_customer_id = int(row["Customer ID"])

            # Find the corresponding RetailIQ customer
            customer = (
                db.query(Customer)
                .filter(
                    Customer.ml_customer_id == ml_customer_id
                )
                .first()
            )

            if customer is None:
                print(
                    f"Customer not found for ML ID: {ml_customer_id}"
                )
                skipped += 1
                continue

            # Check whether segmentation already exists
            existing = (
                db.query(CustomerSegment)
                .filter(
                    CustomerSegment.customer_id == customer.id
                )
                .first()
            )

            if existing:
                skipped += 1
                continue

            segment = CustomerSegment(
                customer_id=customer.id,
                ml_cluster=int(row["ML_Cluster"]),
                segment_name=str(row["ML_Segment"])
            )

            db.add(segment)
            inserted += 1

        db.commit()

        print("Customer segmentation seeding completed.")
        print(f"Inserted: {inserted}")
        print(f"Skipped:  {skipped}")

    except Exception as e:
        db.rollback()
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_customer_segments()