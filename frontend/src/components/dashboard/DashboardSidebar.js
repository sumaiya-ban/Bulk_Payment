import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  LayoutDashboard,
  Send,
  History,
  Users,
  Settings,
  LogOut,
  Zap,
  ShieldCheck,
  UserPlus,
  Globe,
  MessageCircle,
  Headphones,
  Menu 
} from "lucide-react";

const menuGroups = [
  {
    titleEn: "Dashboard",
    titleBn: "ড্যাশবোর্ড",
    icon: LayoutDashboard,
    roles: ["admin", "customer"],
    children: [
      { titleEn: "Overview", titleBn: "ওভারভিউ", url: "/dashboard", icon: LayoutDashboard },
      { titleEn: "Transactions", titleBn: "লেনদেন", url: "/dashboard/transactions", icon: History },
    ],
  },
  {
    titleEn: "Payments",
    titleBn: "পেমেন্ট",
    icon: Send,
    roles: ["admin", "customer"],
    children: [
      { titleEn: "Send Payment", titleBn: "পেমেন্ট পাঠান", url: "/dashboard/send", icon: Send },
      { titleEn: "Recipients", titleBn: "গ্রহীতারা", url: "/dashboard/recipients", icon: Users, roles: ["admin"] },
    ],
  },
  {
    titleEn: "Verification",
    titleBn: "যাচাই",
    icon: ShieldCheck,
    roles: ["admin", "customer"],
    children: [
      { titleEn: "KYC Verification", titleBn: "কেওয়াইসি যাচাই", url: "/dashboard/verification", icon: ShieldCheck },
    ],
  },
  {
    titleEn: "Management",
    titleBn: "ম্যানেজমেন্ট",
    icon: Settings,
    roles: ["admin"],
    children: [
      { titleEn: "Create Customer", titleBn: "কাস্টমার তৈরি", url: "/dashboard/customers", icon: UserPlus },
      { titleEn: "Settings", titleBn: "সেটিংস", url: "/dashboard/setting", icon: Settings },
      { titleEn: "Landing Page", titleBn: "ল্যান্ডিং পেজ", url: "/dashboard/landing", icon: Globe },
    ],
  },
  {
    titleEn: "Support",
    titleBn: "সাপোর্ট",
    icon: MessageCircle,
    roles: ["admin", "customer"],
    children: [
      { titleEn: "Message Request", titleBn: "Message Request", url: "/dashboard/message-request", icon: MessageCircle, roles: ["admin"] },
      { titleEn: "Support Chat", titleBn: "Support Chat", url: "/dashboard/support-chat", icon: Headphones },
    ],
  },
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

  // const filteredMain = menuItems.filter(item => role && item.roles.includes(role));
  const filteredFinance = financeItems.filter(item => role && item.roles.includes(role));
  const currentText = sidebarText[language]; // now admin sees language changes too
  const getLabel = item => (language === "bn" ? item.titleBn : item.titleEn);

  const menuClass =
  "flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-green-200 text-green-900 transition-all";
  const activeClass = "bg-sidebar-active text-white";
const [openMenus, setOpenMenus] = useState({});
const toggleMenu = (title) => {
  setOpenMenus((prev) => ({
    ...prev,
    [title]: !prev[title],
  }));
};
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
         {menuGroups.map((group) => {
  if (!group.roles.includes(role)) return null;

  const isOpen = openMenus[group.titleEn];

  return (
    <div key={group.titleEn} className="mb-2">
      
      {/* HEADER (Department Style) */}
      {!collapsed && (
        <p className="text-xs text-green-900 px-3 mt-3 mb-1 uppercase tracking-wide">
          {language === "bn" ? group.titleBn : group.titleEn}
        </p>
      )}

      {/* MAIN MENU BUTTON */}
     <div
  onClick={() => toggleMenu(group.titleEn)}
  className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-xl hover:bg-green-200"
>
  {/* LEFT SIDE */}
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-300 text-green-900">
      <group.icon size={18} />
    </div>

    {!collapsed && (
      <span className="text-sm font-medium text-green-900">
        {language === "bn" ? group.titleBn : group.titleEn}
      </span>
    )}
  </div>

  {/* RIGHT SIDE (DROPDOWN ICON ALWAYS VISIBLE) */}
  <div className="flex items-center">
    <ChevronDown
      size={18}
      className={`text-green-900 transition-transform duration-300 ${
        openMenus[group.titleEn] ? "rotate-180" : ""
      }`}
    />
  </div>
</div>

      {/* SUBMENU */}
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {group.children.map((item) => {
            if (item.roles && !item.roles.includes(role)) return null;

            const Icon = item.icon;

            return (
              <NavLink
                key={item.titleEn}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  location.pathname === item.url
                    ? "bg-green-400 text-green-900 font-semibold"
                    : "hover:bg-green-100"
                }`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    location.pathname === item.url
                      ? "bg-green-600 text-white"
                      : "bg-green-200 text-green-800"
                  }`}
                >
                  <Icon size={16} />
                </div>

                {!collapsed && (
                  <span className="text-sm text-green-900">
                    {language === "bn" ? item.titleBn : item.titleEn}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
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
