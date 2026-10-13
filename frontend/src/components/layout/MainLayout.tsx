import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

import {
  ShoppingBag,
  ClipboardList,
  Package,
  UserRound,
  ScanBarcode,
  Bell,
  Sparkles,
} from "lucide-react";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { useAuth } from "../../context/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
}

// ============================================================
// CUSTOMER LAYOUT
// ============================================================

function CustomerLayout({ children }: MainLayoutProps) {
  const navLinkClass = ({
    isActive,
  }: {
    isActive: boolean;
  }) =>
    [
      "ri-customer-nav-link",
      isActive ? "ri-customer-nav-active" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="ri-customer-layout">
      {/* Customer header */}

      <header className="ri-customer-header">
        <div className="ri-customer-header-inner">
          <Link to="/shop" className="ri-brand">
            <div className="ri-brand-icon">
              <Sparkles size={23} />
            </div>

            <div className="ri-brand-copy">
              <span className="ri-brand-name">RetailIQ</span>
              <span className="ri-brand-subtitle">
                Smart shopping experience
              </span>
            </div>
          </Link>

          <nav
            aria-label="Customer navigation"
            className="ri-customer-navigation"
          >
            <NavLink to="/shop" className={navLinkClass}>
              <ShoppingBag size={17} />
              <span>Shop</span>
            </NavLink>

            <NavLink to="/my-lists" className={navLinkClass}>
              <ClipboardList size={17} />
              <span>My Lists</span>
            </NavLink>

            <NavLink to="/my-orders" className={navLinkClass}>
              <Package size={17} />
              <span>My Orders</span>
            </NavLink>

            <NavLink to="/my-profile" className={navLinkClass}>
              <UserRound size={17} />
              <span>My Profile</span>
            </NavLink>
          </nav>
        </div>

        {/* Customer features */}

        <div className="ri-customer-features">
          <div className="ri-customer-features-inner">
            <span>
              <Sparkles size={15} />
              AI-powered recommendations
            </span>

            <span>
              <ScanBarcode size={15} />
              Smart product discovery
            </span>

            <span>
              <Bell size={15} />
              Order updates
            </span>
          </div>
        </div>
      </header>

      {/* Customer content */}

      <main className="ri-customer-main">
        <div className="ri-page-container">
          {children}
        </div>
      </main>

      {/* Footer */}

      <footer className="ri-customer-footer">
        <div className="ri-customer-footer-inner">
          <p>© {new Date().getFullYear()} RetailIQ</p>

          <p>
            Smarter shopping, powered by retail intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// MAIN LAYOUT
// ============================================================

function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="ri-layout-loading">
        <div className="ri-layout-loading-content">
          <div className="ri-layout-loading-logo">
            <Sparkles size={25} />
          </div>

          <div
            className="ri-layout-spinner"
            role="status"
            aria-label="Loading"
          />

          <h2>RetailIQ</h2>

          <p>Preparing your intelligence workspace...</p>
        </div>
      </div>
    );
  }

  const userData = user as unknown as Record<
    string,
    unknown
  > | null;

  const role = String(
    userData?.["role"] ??
      userData?.["user_role"] ??
      "",
  ).toLowerCase();

  // Customers have their own shopping layout.

  if (role === "customer") {
    return <CustomerLayout>{children}</CustomerLayout>;
  }

  // Admin and staff dashboard layout.

  return (
    <div className="ri-admin-layout">
      <Sidebar />

      <div className="ri-admin-workspace">
        <TopNavbar />

        <main className="ri-admin-main">
          <div className="ri-admin-content">
            {children}
          </div>
        </main>

        <footer className="ri-admin-footer">
          <span>
            © {new Date().getFullYear()} RetailIQ
          </span>

          <span>
            AI-powered retail intelligence platform
          </span>
        </footer>
      </div>
    </div>
  );
}

export default MainLayout;