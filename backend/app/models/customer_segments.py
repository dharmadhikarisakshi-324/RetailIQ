from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


class CustomerSegment(Base):
    __tablename__ = "customer_segments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False,
        unique=True
    )

    ml_cluster = Column(
        Integer,
        nullable=True
    )

    segment_name = Column(
        String(100),
        nullable=False
    )

    customer = relationship("Customer")