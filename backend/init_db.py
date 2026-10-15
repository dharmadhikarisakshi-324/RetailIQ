
from backend.app.database.connection import Base, engine
from backend.app import models

def main():
    Base.metadata.create_all(bind=engine)
    print("RetailIQ database tables created successfully.")

if __name__ == "__main__":
    main()
