import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# Find the RetailIQ project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Load environment variables from the project root
load_dotenv(PROJECT_ROOT / ".env")

# Read the database URL securely from .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Please configure it in the project root .env file."
    )

# Create the database engine
engine = create_engine(
    DATABASE_URL,
    echo=False,
)

# Create database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for SQLAlchemy models
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()