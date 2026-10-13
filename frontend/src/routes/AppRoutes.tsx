import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import type { ReactNode } from "react";

import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";

// Authentication
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// Dashboard and POS
import DashboardPage from "../pages/dashboard/DashboardPage";
import POSPage from "../pages/pos/POSPage";

// Products
import ProductsPage from "../pages/products/ProductsPage";
import ProductIntelligencePage from "../pages/products/ProductIntelligencePage";

// Customers
import CustomersPage from "../pages/customers/CustomersPage";
import CustomerIntelligencePage from "../pages/customers/CustomerIntelligencePage";

// Inventory
import InventoryIntelligencePage from "../pages/inventory/InventoryIntelligencePage";

// Orders and payments
import OrdersPage from "../pages/orders/OrdersPage";
import PaymentsPage from "../pages/payments/PaymentsPage";

// AI intelligence
import AIIntelligencePage from "../pages/intelligence/AIIntelligencePage";
import PromotionIntelligencePage from "../pages/promotions/PromotionIntelligencePage";

// Analytics
import AnalyticsPage from "../pages/analytics/AnalyticsPage";

// Customer shopping
import ShopPage from "../pages/shop/ShopPage";
import MyOrdersPage from "../pages/shop/MyOrdersPage";
import CustomerProfilePage from "../pages/shop/CustomerProfilePage";
import ShoppingListsPage from "../pages/shop/ShoppingListsPage";

// ============================================================
// USER ROLES
// ============================================================

type UserRole = "admin" | "staff" | "customer";

const ALL_ROLES: UserRole[] = [
  "admin",
  "staff",
  "customer",
];

const ADMIN_STAFF: UserRole[] = [
  "admin",
  "staff",
];

const ADMIN_ONLY: UserRole[] = [
  "admin",
];

const CUSTOMER_ONLY: UserRole[] = [
  "customer",
];

// ============================================================
// ROLE-BASED LANDING PAGE
// ============================================================

function getLandingPath(role?: string | null): string {
  switch (role?.toLowerCase()) {
    case "admin":
    case "staff":
      return "/dashboard";

    case "customer":
      return "/shop";

    default:
      return "/login";
  }
}

// ============================================================
// PREMIUM LOADING SCREEN
// ============================================================

function LoadingScreen() {
  return (
    <main className="ri-loading-screen">
      <div className="ri-loading-content">
        <div className="ri-loading-logo" aria-hidden="true">
          <span>R</span>
        </div>

        <div className="ri-loading-spinner" role="status" aria-label="Loading" />

        <h1>RetailIQ</h1>

        <p>Preparing your retail intelligence workspace...</p>
      </div>
    </main>
  );
}

// ============================================================
// PLACEHOLDER PAGE
// ============================================================

function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="ri-placeholder-page">
      <div className="ri-placeholder-icon" aria-hidden="true">
        ✦
      </div>

      <p className="ri-eyebrow">RETAILIQ WORKSPACE</p>

      <h1>{title}</h1>

      <p className="ri-placeholder-description">
        {description}
      </p>

      <div className="ri-placeholder-note">
        This section is ready for the next implementation stage.
      </div>
    </section>
  );
}

// ============================================================
// PROTECTED PAGE
// ============================================================

function ProtectedPage({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) {
  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const role = user.role?.toLowerCase();

  if (
    !role ||
    !allowedRoles.includes(role as UserRole)
  ) {
    return (
      <Navigate
        to={getLandingPath(role)}
        replace
      />
    );
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}

// ============================================================
// APPLICATION ROUTES
// ============================================================

function AppRoutes() {
  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const landingPath = getLandingPath(user?.role);

  const defaultPath = isAuthenticated
    ? landingPath
    : "/login";

  return (
    <Routes>
      {/* Authentication */}

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={landingPath} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={landingPath} replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Customer shopping */}

      <Route
        path="/shop"
        element={
          <ProtectedPage allowedRoles={CUSTOMER_ONLY}>
            <ShopPage />
          </ProtectedPage>
        }
      />

      <Route
        path="/my-orders"
        element={
          <ProtectedPage allowedRoles={CUSTOMER_ONLY}>
            <MyOrdersPage />
          </ProtectedPage>
        }
      />

      <Route
        path="/my-profile"
        element={
          <ProtectedPage allowedRoles={CUSTOMER_ONLY}>
            <CustomerProfilePage />
          </ProtectedPage>
        }
      />

      <Route
        path="/my-lists"
        element={
          <ProtectedPage allowedRoles={CUSTOMER_ONLY}>
            <ShoppingListsPage />
          </ProtectedPage>
        }
      />

      {/* Dashboard */}

      <Route
        path="/dashboard"
        element={
          <ProtectedPage allowedRoles={ADMIN_STAFF}>
            <DashboardPage />
          </ProtectedPage>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedPage allowedRoles={ADMIN_STAFF}>
            <POSPage />
          </ProtectedPage>
        }
      />

      {/* Products */}

      <Route
        path="/products"
        element={
          <ProtectedPage allowedRoles={ALL_ROLES}>
            <ProductsPage />
          </ProtectedPage>
        }
      />

      <Route
        path="/product-intelligence"
        element={
          <ProtectedPage allowedRoles={ADMIN_ONLY}>
            <ProductIntelligencePage />
          </ProtectedPage>
        }
      />

      {/* Customers */}

      <Route
        path="/customers"
        element={
          <ProtectedPage allowedRoles={ADMIN_STAFF}>
            <CustomersPage />
          </ProtectedPage>
        }
      />

      <Route
        path="/customer-intelligence"
        element={
          <ProtectedPage allowedRoles={ADMIN_ONLY}>
            <CustomerIntelligencePage />
          </ProtectedPage>
        }
      />

      {/* Orders and payments */}

      <Route
        path="/orders"
        element={
          <ProtectedPage allowedRoles={ADMIN_STAFF}>
            <OrdersPage />
          </ProtectedPage>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedPage allowedRoles={ADMIN_STAFF}>
            <PaymentsPage />
          </ProtectedPage>
        }
      />

      {/* Inventory */}

      <Route
        path="/inventory"
        element={
          <ProtectedPage allowedRoles={ADMIN_STAFF}>
            <InventoryIntelligencePage />
          </ProtectedPage>
        }
      />

      {/* AI intelligence */}

      <Route
        path="/intelligence"
        element={
          <ProtectedPage allowedRoles={ADMIN_ONLY}>
            <AIIntelligencePage />
          </ProtectedPage>
        }
      />

      <Route
        path="/promotions"
        element={
          <ProtectedPage allowedRoles={ADMIN_ONLY}>
            <PromotionIntelligencePage />
          </ProtectedPage>
        }
      />

      {/* Analytics */}

      <Route
        path="/analytics"
        element={
          <ProtectedPage allowedRoles={ADMIN_ONLY}>
            <AnalyticsPage />
          </ProtectedPage>
        }
      />

      {/* Reports */}

      <Route
        path="/reports"
        element={
          <ProtectedPage allowedRoles={ADMIN_ONLY}>
            <PlaceholderPage
              title="Reports"
              description="Retail reports and business performance summaries."
            />
          </ProtectedPage>
        }
      />

      {/* Settings */}

      <Route
        path="/settings"
        element={
          <ProtectedPage allowedRoles={ALL_ROLES}>
            <PlaceholderPage
              title="Settings"
              description="Manage your RetailIQ workspace preferences."
            />
          </ProtectedPage>
        }
      />

      {/* Default route */}

      <Route
        path="/"
        element={
          <Navigate to={defaultPath} replace />
        }
      />

      {/* Unknown route */}

      <Route
        path="*"
        element={
          <Navigate to={defaultPath} replace />
        }
      />
    </Routes>
  );
}

export default AppRoutes;