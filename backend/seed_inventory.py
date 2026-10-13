from sqlalchemy.orm import Session

from backend.app.database.connection import SessionLocal

# Import related models before Product
# This ensures SQLAlchemy knows about Category
# before initializing the Product relationship.
from backend.app.models.category import Category
from backend.app.models.product import Product
from backend.app.models.inventory import Inventory


def seed_inventory():
    db: Session = SessionLocal()

    inserted = 0
    skipped = 0

    try:
        # Get all products
        products = db.query(Product).all()

        print(f"Products found: {len(products)}")

        for product in products:

            # Check whether inventory already exists
            existing = (
                db.query(Inventory)
                .filter(Inventory.product_id == product.id)
                .first()
            )

            if existing:
                skipped += 1
                continue

            # Initial demo stock
            stock_quantity = 100

            # Reorder when stock reaches 20
            reorder_level = 20

            # Suggested replenishment quantity
            reorder_quantity = 50

            # Initial demo unit cost
            unit_cost = product.price * 0.70

            inventory = Inventory(
                product_id=product.id,
                stock_quantity=stock_quantity,
                reorder_level=reorder_level,
                reorder_quantity=reorder_quantity,
                unit_cost=unit_cost
            )

            db.add(inventory)
            inserted += 1

            # Commit every 500 records
            if inserted % 500 == 0:
                db.commit()
                print(f"Inserted: {inserted}")

        # Commit remaining records
        db.commit()

        print()
        print("Inventory seeding completed.")
        print(f"Inserted: {inserted}")
        print(f"Skipped:  {skipped}")

    except Exception as e:
        db.rollback()

        print()
        print("Error:")
        print(e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_inventory()