import pandas as pd
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal

# Import related models before Product
from backend.app.models.category import Category
from backend.app.models.product import Product


CSV_PATH = r"D:\AI-Retail-Intelligence\ml\data\processed\product_summary.csv"


def seed_products():
    df = pd.read_csv(CSV_PATH)

    db: Session = SessionLocal()

    inserted = 0
    skipped = 0

    try:
        for index, row in df.iterrows():

            product_code = str(row["StockCode"]).strip()

            # Check whether product already exists
            existing = (
                db.query(Product)
                .filter(Product.product_code == product_code)
                .first()
            )

            if existing:
                skipped += 1
                continue

            # Calculate average historical selling price
            if (
                pd.notna(row["TotalQuantity"])
                and float(row["TotalQuantity"]) > 0
            ):
                price = float(
                    row["TotalRevenue"] / row["TotalQuantity"]
                )
            else:
                price = 0.0

            product = Product(
                product_code=product_code,
                barcode=None,
                name=str(row["Description"]),
                description=str(row["Description"]),
                category_id=None,
                price=price,
                supplier=None,
                aisle=None,
                shelf=None,
                is_active=True
            )

            try:
                db.add(product)
                db.commit()

                inserted += 1

                if inserted % 100 == 0:
                    print(f"Inserted: {inserted}")

            except IntegrityError as e:
                db.rollback()

                print()
                print("PRODUCT INSERT FAILED")
                print("----------------------")
                print(f"CSV row       : {index}")
                print(f"Product code  : {product_code}")
                print(f"Description   : {row['Description']}")
                print(f"Price         : {price}")
                print()
                print("Database error:")
                print(e.orig)
                print()

                return

        print()
        print("Product seeding completed.")
        print(f"Inserted: {inserted}")
        print(f"Skipped:  {skipped}")

    except Exception as e:
        db.rollback()
        print()
        print("Unexpected error:")
        print(e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_products()