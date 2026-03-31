import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Send,
  History,
  Users,
  Settings,
  LogOut,
  Zap,
  CreditCard,
  Wallet,
  Menu,
} from "lucide-react";

/* ================= MENU CONFIG ================= */

const menuItems = [
  {
    titleEn: "Overview",
    titleBn: "ওভারভিউ",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "customer"],
  },
  {
    titleEn: "Send Payment",
    titleBn: "পেমেন্ট পাঠান",
    url: "/dashboard/send",
    icon: Send,
    roles: ["customer"],
  },
  {
    titleEn: "Transactions",
    titleBn: "লেনদেন",
    url: "/dashboard/transactions",
    icon: History,
    roles: ["admin", "customer"],
  },
  {
    titleEn: "KYC Verification",
    titleBn: "কেওয়াইসি যাচাই",
    url: "/dashboard/verification",
    icon: Send,
    roles: ["customer"],
  },
  {
    titleEn: "Recipients",
    titleBn: "গ্রহীতারা",
    url: "/dashboard/recipients",
    icon: Users,
    roles: ["admin"],
  },
  {
    titleEn: "Create Customer",
    titleBn: "কাস্টমার তৈরি",
    url: "/dashboard/customers",
    icon: Users,
    roles: ["admin"],
  },
];

const financeItems = [
  {
    titleEn: "Cards",
    titleBn: "কার্ড",
    url: "/dashboard/cards",
    icon: CreditCard,
    roles: ["admin", "customer"],
  },
  {
    titleEn: "Wallet",
    titleBn: "ওয়ালেট",
    url: "/dashboard/wallet",
    icon: Wallet,
    roles: ["admin", "customer"],
  },
];

const sidebarText = {
  en: {
    main: "MAIN",
    finance: "FINANCE",
    settings: "Settings",
    logout: "Logout",
    toggleLabel: "বাংলা",
  },
  bn: {
    main: "মেইন",
    finance: "ফাইন্যান্স",
    settings: "সেটিংস",
    logout: "লগআউট",
    toggleLabel: "English",
  },
};

/* ================= SIDEBAR ================= */

const DashboardSidebar = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* GET USER ROLE */
const user = JSON.parse(localStorage.getItem("user") || "{}");
const role = user.role; // admin or customer
const isCustomer = role === "customer";
const [language, setLanguage] = useState(() => {
  if (!isCustomer) {
    return "en";
  }

  return localStorage.getItem("customerSidebarLanguage") || "bn";
});
useEffect(() => {
  if (!isCustomer) {
    return undefined;
  }

  const syncLanguage = () => {
    setLanguage(localStorage.getItem("customerSidebarLanguage") || "bn");
  };

  window.addEventListener("customer-sidebar-language-change", syncLanguage);

  return () => {
    window.removeEventListener("customer-sidebar-language-change", syncLanguage);
  };
}, [isCustomer]);
 //const user = JSON.parse(localStorage.getItem("user") || "{}");
 //const role = user.type || "admin";
  /* FILTER MENU BY ROLE */
const filteredMain = menuItems.filter(item => role && item.roles.includes(role));
const filteredFinance = financeItems.filter(
  (item) => !role || item.roles.includes(role)
);
const currentText = isCustomer ? sidebarText[language] : sidebarText.en;

  const getLabel = (item) =>
    isCustomer && language === "bn" ? item.titleBn : item.titleEn;

  const menuClass =
    "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100";

  const activeClass = "bg-blue-100 text-blue-600";

  return (
    <div className="flex bg-gray-100 h-screen">

      {/* Mobile Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <div
        className={`bg-white border-r transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 fixed md:relative h-full z-40`}
      >

        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-lg font-bold text-blue-600">
            <Zap className="w-5 h-5" />
            {!collapsed && <span>BulkPay</span>}
          </div>

          <button onClick={() => setCollapsed(!collapsed)}>
            <Menu size={18} />
          </button>
        </div>

        {/* Menu */}
        <div className="p-2">

          {/* MAIN */}
          <p className={`text-xs text-gray-400 px-4 mb-2 ${collapsed && "hidden"}`}>
            {currentText.main}
          </p>

          {filteredMain.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.titleEn}
                to={item.url}
                className={`${menuClass} ${
                  location.pathname === item.url ? activeClass : ""
                }`}
              >
                <Icon size={18} />
                {!collapsed && <span>{getLabel(item)}</span>}
              </NavLink>
            );
          })}

          {/* FINANCE */}
          <p className={`text-xs text-gray-400 px-4 mt-6 mb-2 ${collapsed && "hidden"}`}>
            {currentText.finance}
          </p>

          {filteredFinance.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.titleEn}
                to={item.url}
                className={`${menuClass} ${
                  location.pathname === item.url ? activeClass : ""
                }`}
              >
                <Icon size={18} />
                {!collapsed && <span>{getLabel(item)}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-2 border-t">

          <NavLink
            to="/dashboard/settings"
            className={`${menuClass} ${
              location.pathname === "/dashboard/settings"
                ? activeClass
                : ""
            }`}
          >
            <Settings size={18} />
            {!collapsed && <span>{currentText.settings}</span>}
          </NavLink>

          <a href="/" className={menuClass}>
            <LogOut size={18} />
            {!collapsed && <span>{currentText.logout}</span>}
          </a>

        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardSidebar;
