from backend.app.database.connection import Base, engine
from backend.app.models.shopping_list import (
    ShoppingList,
    ShoppingListItem,
)


def main():
    Base.metadata.create_all(
        bind=engine,
        tables=[
            ShoppingList.__table__,
            ShoppingListItem.__table__,
        ],
    )

    print("Shopping Lists tables created successfully.")


if __name__ == "__main__":
    main()