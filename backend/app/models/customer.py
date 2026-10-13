from sqlalchemy import Column, Integer, String, Boolean

from backend.app.database.connection import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    ml_customer_id = Column(
        Integer,
        unique=True,
        nullable=True,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=True
    )

    phone = Column(
        String(20),
        unique=True,
        nullable=True
    )

    loyalty_member = Column(
        Boolean,
        default=False
    )

    is_active = Column(
        Boolean,
        default=True
    )