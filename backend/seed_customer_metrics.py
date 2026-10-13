import pandas as pd
from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal
from backend.app.models.customer import Customer
from backend.app.models.customer_metrics import CustomerMetrics


CSV_PATH = r"D:\AI-Retail-Intelligence\ml\data\processed\customer_rfm.csv"


def seed_customer_metrics():
    df = pd.read_csv(CSV_PATH)

    # Convert ML Customer ID to integer
    df["Customer ID"] = df["Customer ID"].astype(int)

    db: Session = SessionLocal()

    try:
        inserted = 0
        skipped = 0

        for _, row in df.iterrows():

            ml_customer_id = int(row["Customer ID"])

            # Find corresponding RetailIQ customer
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

            # Check if metrics already exist
            existing = (
                db.query(CustomerMetrics)
                .filter(
                    CustomerMetrics.customer_id == customer.id
                )
                .first()
            )

            if existing:
                skipped += 1
                continue

            metrics = CustomerMetrics(
                customer_id=customer.id,

                total_spending=float(
                    row["TotalSpending"]
                ),

                total_quantity=int(
                    row["TotalQuantity"]
                ),

                number_of_transactions=int(
                    row["NumberOfTransactions"]
                ),

                recency=int(
                    row["Recency"]
                ),

                average_order_value=float(
                    row["AverageOrderValue"]
                ),

                r_score=int(
                    row["R_Score"]
                ),

                f_score=int(
                    row["F_Score"]
                ),

                m_score=int(
                    row["M_Score"]
                ),

                rfm_score=int(
                    row["RFM_Score"]
                ),

                rfm_total=int(
                    row["RFM_Total"]
                ),
            )

            db.add(metrics)
            inserted += 1

        db.commit()

        print("Customer metrics seeding completed.")
        print(f"Inserted: {inserted}")
        print(f"Skipped:  {skipped}")

    except Exception as e:
        db.rollback()
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_customer_metrics()