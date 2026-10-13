import {
  BarChart3,
  BadgePercent,
  Boxes,
  Brain,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  UserCircle,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type UserRole = "admin" | "staff" | "customer";

interface NavigationItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff"],
  },
  {
    label: "POS & Billing",
    path: "/pos",
    icon: ShoppingCart,
    roles: ["admin", "staff"],
  },
  {
    label: "Products",
    path: "/products",
    icon: Package,
    roles: ["admin", "staff", "customer"],
  },
  {
    label: "Product Intelligence",
    path: "/product-intelligence",
    icon: Brain,
    roles: ["admin"],
  },
  {
    label: "Customers",
    path: "/customers",
    icon: Users,
    roles: ["admin", "staff"],
  },
  {
    label: "Customer Intelligence",
    path: "/customer-intelligence",
    icon: Brain,
    roles: ["admin"],
  },
  {
    label: "Orders",
    path: "/orders",
    icon: ClipboardList,
    roles: ["admin", "staff"],
  },
  {
    label: "Payments",
    path: "/payments",
    icon: CreditCard,
    roles: ["admin", "staff"],
  },
  {
    label: "Inventory",
    path: "/inventory",
    icon: Boxes,
    roles: ["admin", "staff"],
  },
  {
    label: "Promotion Intelligence",
    path: "/promotions",
    icon: BadgePercent,
    roles: ["admin"],
  },
  {
    label: "AI Intelligence",
    path: "/intelligence",
    icon: Sparkles,
    roles: ["admin"],
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
    roles: ["admin"],
  },
];

// ============================================================
// SIDEBAR
// ============================================================

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { user } = useAuth();

  const role = user?.role?.toLowerCase() as
    | UserRole
    | undefined;

  const visibleItems = navigationItems.filter((item) =>
    role ? item.roles.includes(role) : false,
  );

  const isCustomer = role === "customer";

  const settingsPath = isCustomer
    ? "/my-profile"
    : "/settings";

  return (
    <>
      {/* Mobile backdrop */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="ri-sidebar-backdrop"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`ri-sidebar ${
          mobileOpen ? "ri-sidebar-mobile-open" : ""
        }`}
        aria-label="Main sidebar"
      >
        {/* Brand */}

        <div className="ri-sidebar-brand">
          <NavLink
            to={isCustomer ? "/shop" : "/dashboard"}
            className="ri-sidebar-brand-link"
            onClick={onMobileClose}
          >
            <div className="ri-sidebar-logo">
              <Sparkles size={23} strokeWidth={2.2} />
            </div>

            <div className="ri-sidebar-brand-copy">
              <span className="ri-sidebar-brand-name">
                RetailIQ
              </span>

              <span className="ri-sidebar-brand-subtitle">
                {isCustomer
                  ? "Customer Portal"
                  : "Retail Intelligence"}
              </span>
            </div>
          </NavLink>

          {/* Mobile close button */}

          <button
            type="button"
            className="ri-sidebar-close"
            aria-label="Close sidebar"
            onClick={onMobileClose}
          >
            <X size={19} />
          </button>
        </div>

        {/* Workspace indicator */}

        {!isCustomer && (
          <div className="ri-sidebar-workspace">
            <span className="ri-workspace-indicator" />

            <div>
              <p className="ri-workspace-label">
                WORKSPACE
              </p>

              <p className="ri-workspace-value">
                {role === "admin"
                  ? "Administrator"
                  : role === "staff"
                    ? "Staff workspace"
                    : "Retail workspace"}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}

        <nav
          className="ri-sidebar-navigation"
          aria-label="Primary navigation"
        >
          <p className="ri-sidebar-section-label">
            {isCustomer ? "MY SHOPPING" : "MAIN MENU"}
          </p>

          <div className="ri-sidebar-menu">
            {visibleItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    [
                      "ri-sidebar-link",
                      isActive
                        ? "ri-sidebar-link-active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="ri-sidebar-link-icon">
                        <Icon
                          size={19}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                      </span>

                      <span className="ri-sidebar-link-label">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight
                          className="ri-sidebar-chevron"
                          size={16}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}

        <div className="ri-sidebar-bottom">
          {!isCustomer && (
            <div className="ri-sidebar-ai-card">
              <div className="ri-sidebar-ai-icon">
                <Sparkles size={17} />
              </div>

              <div className="ri-sidebar-ai-copy">
                <p>Retail Intelligence</p>

                <span>
                  AI-powered business insights
                </span>
              </div>
            </div>
          )}

          <NavLink
            to={settingsPath}
            onClick={onMobileClose}
            className={({ isActive }) =>
              [
                "ri-sidebar-link",
                "ri-sidebar-settings",
                isActive
                  ? "ri-sidebar-link-active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            {isCustomer ? (
              <UserCircle size={19} />
            ) : (
              <Settings size={19} />
            )}

            <span className="ri-sidebar-link-label">
              {isCustomer ? "My Profile" : "Settings"}
            </span>

            <ChevronRight
              className="ri-sidebar-chevron"
              size={16}
            />
          </NavLink>

          <div className="ri-sidebar-version">
            <span>RetailIQ</span>
            <span>AI Retail Platform</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;