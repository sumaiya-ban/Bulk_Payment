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

const menuItems = [
  { titleEn: "Overview", titleBn: "ওভারভিউ", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "customer"] },
  { titleEn: "Send Payment", titleBn: "পেমেন্ট পাঠান", url: "/dashboard/send", icon: Send, roles: ["admin", "customer"] },
  { titleEn: "Transactions", titleBn: "লেনদেন", url: "/dashboard/transactions", icon: History, roles: ["admin", "customer"] },
  { titleEn: "KYC Verification", titleBn: "কেওয়াইসি যাচাই", url: "/dashboard/verification", icon: Send, roles: ["admin", "customer"] },
  { titleEn: "Recipients", titleBn: "গ্রহীতারা", url: "/dashboard/recipients", icon: Users, roles: ["admin"] },
  { titleEn: "Create Customer", titleBn: "কাস্টমার তৈরি", url: "/dashboard/customers", icon: Users, roles: ["admin"] },
  { titleEn: "Setting", titleBn: "সেটিংস", url: "/dashboard/setting", icon: Wallet, roles: ["admin"] },
];

const financeItems = [
  // { titleEn: "Cards", titleBn: "কার্ড", url: "/dashboard/cards", icon: CreditCard, roles: ["admin", "customer"] },
  // { titleEn: "Wallet", titleBn: "ওয়ালেট", url: "/dashboard/wallet", icon: Wallet, roles: ["admin", "customer"] },
  
];

const sidebarText = {
  en: { main: "MAIN", finance: "FINANCE", settings: "Settings", logout: "Logout", toggleLabel: "বাংলা" },
  bn: { main: "মেইন", finance: "ফাইন্যান্স", settings: "সেটিংস", logout: "লগআউট", toggleLabel: "English" },
};

const DashboardSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "admin";
  const isCustomer = role === "customer";

  /* LANGUAGE STATE (works for all roles) */
  const [language, setLanguage] = useState(() => {
  const savedLang = localStorage.getItem("customerSidebarLanguage");
  if (!savedLang) {
    localStorage.setItem("customerSidebarLanguage", "bn");
    return "bn";
  }
  return savedLang;
});

// Listen for language changes
useEffect(() => {
  const syncLanguage = () => {
    const lang = localStorage.getItem("customerSidebarLanguage") || "bn";
    setLanguage(lang);
  };

  window.addEventListener("customer-sidebar-language-change", syncLanguage);

  return () => {
    window.removeEventListener("customer-sidebar-language-change", syncLanguage);
  };
}, []);
 

  /* TOGGLE BUTTON ONLY FOR CUSTOMER */
  const toggleLanguage = () => {
    if (isCustomer) {
      const nextLanguage = language === "bn" ? "en" : "bn";
      localStorage.setItem("sidebarLanguage", nextLanguage);
      window.dispatchEvent(new Event("sidebar-language-change"));
    }
  };

  const filteredMain = menuItems.filter(item => role && item.roles.includes(role));
  const filteredFinance = financeItems.filter(item => role && item.roles.includes(role));
  const currentText = sidebarText[language]; // now admin sees language changes too
  const getLabel = item => (language === "bn" ? item.titleBn : item.titleEn);

  const menuClass = "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-green-200 text-black transition-colors";
  const activeClass = "bg-sidebar-active text-white";

  return (
    <>
      {/* Mobile Button */}
      <button className="md:hidden fixed top-4 left-4 z-50 text-blue-900" onClick={() => setMobileOpen(!mobileOpen)}>
        <Menu />
      </button>

      <div
        className={`bg-green-100 text-green-200 border-r border-sidebar-text transition-all duration-300 flex flex-col
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        fixed inset-y-0 left-0 z-40 md:sticky md:top-0 md:translate-x-0 h-screen`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-green-200">
          <div className="flex items-center gap-2 text-lg font-bold text-green-900">
            <Zap className="w-5 h-5 text-blue-900" />
            {!collapsed && <span>BulkPay</span>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)}>
            <Menu size={18} className="text-green-800" />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto p-2">
           

          {/* MAIN */}
          <p className={`text-xs text-green-800 px-4 mb-2 ${collapsed && "hidden"}`}>{currentText.main}</p>
          {filteredMain.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.titleEn}
                to={item.url}
                className={`${menuClass} ${location.pathname === item.url ? activeClass : ""}`}
              >
                <Icon size={18} />
                {!collapsed && <span>{getLabel(item)}</span>}
              </NavLink>
            );
          })}

         
        </div>

        {/* Footer */}
        <div className="mt-auto w-full p-2 border-t border-green-800">
          

          <a href="/" className={menuClass}>
            <LogOut size={18} />
            {!collapsed && <span>{currentText.logout}</span>}
          </a>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;