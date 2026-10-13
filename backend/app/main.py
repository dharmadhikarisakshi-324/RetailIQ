from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load SQLAlchemy models before the application starts.
from backend.app import models
from backend.app.core.security import get_current_user
# API routers
from backend.app.api import (
    auth,
    products,
    inventory,
    customers,
    orders,
    payments,
    inventory_movements,
    promotions,
    recommendations,
    customer_intelligence,
    intelligence,
    analytics,
    product_intelligence,
    shopping_lists
)


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="RetailIQ API",
    description="AI-Powered Retail Intelligence System",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(auth.router)

app.include_router(products.router)

app.include_router(inventory.router)

app.include_router(customers.router)

app.include_router(orders.router)

app.include_router(payments.router)

app.include_router(inventory_movements.router)

app.include_router(promotions.router)

# Customer recommendation endpoints
app.include_router(recommendations.router)

app.include_router(customer_intelligence.router)

app.include_router(intelligence.router)

app.include_router(analytics.router)

# Existing staff-only Product Intelligence endpoints
app.include_router(product_intelligence.router)
app.include_router(shopping_lists.router)
# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "RetailIQ API is running",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }