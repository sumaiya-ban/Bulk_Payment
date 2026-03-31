import { Bell, Plus, Send, UserCircle, ArrowLeft, Languages } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const headerConfig = [
  {
    match: (pathname) => pathname === "/dashboard",
    titleEn: "Dashboard",
    titleBn: "\u09a1\u09cd\u09af\u09be\u09b6\u09ac\u09cb\u09b0\u09cd\u09a1",
    subtitleEn: "Welcome back",
    subtitleBn: "\u0986\u09ac\u09be\u09b0\u0993 \u09b8\u09cd\u09ac\u09be\u0997\u09a4",
    action: {
      labelEn: "Send Payment",
      labelBn: "\u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u09aa\u09be\u09a0\u09be\u09a8",
      icon: Send,
      onClick: (navigate) => navigate("/dashboard/transactions"),
    },
  },
  {
    match: (pathname) => pathname === "/dashboard/profile",
    titleEn: "Profile",
    titleBn: "\u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2",
    subtitleEn: "Manage your account information",
    subtitleBn: "\u0986\u09aa\u09a8\u09be\u09b0 \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f\u09c7\u09b0 \u09a4\u09a5\u09cd\u09af \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8",
  },
  {
    match: (pathname) => pathname === "/dashboard/customers",
    titleEn: "Customers",
    titleBn: "\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u09b0",
    subtitleEn: "Manage customer accounts",
    subtitleBn: "\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u09b0 \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8",
    action: {
      labelEn: "Create Customer",
      labelBn: "\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u09b0 \u09a4\u09c8\u09b0\u09bf",
      icon: Plus,
      onClick: (navigate) => navigate("/dashboard/customers/create"),
    },
  },
  {
    match: (pathname) => pathname === "/dashboard/customers/create",
    titleEn: "Create Customer",
    titleBn: "\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u09b0 \u09a4\u09c8\u09b0\u09bf",
    subtitleEn: "Add a new customer account",
    subtitleBn: "\u09a8\u09a4\u09c1\u09a8 \u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u09b0 \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09af\u09c1\u0995\u09cd\u09a4 \u0995\u09b0\u09c1\u09a8",
    backTo: "/dashboard/customers",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/customers/edit/"),
    titleEn: "Edit Customer",
    titleBn: "\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u09b0 \u098f\u09a1\u09bf\u099f",
    subtitleEn: "Update customer information",
    subtitleBn: "\u0995\u09be\u09b8\u09cd\u099f\u09ae\u09be\u09b0\u09c7\u09b0 \u09a4\u09a5\u09cd\u09af \u0986\u09aa\u09a1\u09c7\u099f \u0995\u09b0\u09c1\u09a8",
    backTo: "/dashboard/customers",
  },
  {
    match: (pathname) => pathname === "/dashboard/recipients",
    titleEn: "Recipients",
    titleBn: "\u0997\u09cd\u09b0\u09b9\u09c0\u09a4\u09be",
    subtitleEn: "Manage saved recipients",
    subtitleBn: "\u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u0997\u09cd\u09b0\u09b9\u09c0\u09a4\u09be \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8",
    action: {
      labelEn: "Create Recipient",
      labelBn: "\u0997\u09cd\u09b0\u09b9\u09c0\u09a4\u09be \u09a4\u09c8\u09b0\u09bf",
      icon: Plus,
      onClick: (navigate) => navigate("/dashboard/recipients/create"),
    },
  },
  {
    match: (pathname) => pathname === "/dashboard/recipients/create",
    titleEn: "Create Recipient",
    titleBn: "\u0997\u09cd\u09b0\u09b9\u09c0\u09a4\u09be \u09a4\u09c8\u09b0\u09bf",
    subtitleEn: "Add a new recipient",
    subtitleBn: "\u09a8\u09a4\u09c1\u09a8 \u0997\u09cd\u09b0\u09b9\u09c0\u09a4\u09be \u09af\u09c1\u0995\u09cd\u09a4 \u0995\u09b0\u09c1\u09a8",
    backTo: "/dashboard/recipients",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard/recipients/edit/"),
    titleEn: "Edit Recipient",
    titleBn: "\u0997\u09cd\u09b0\u09b9\u09c0\u09a4\u09be \u098f\u09a1\u09bf\u099f",
    subtitleEn: "Update recipient information",
    subtitleBn: "\u0997\u09cd\u09b0\u09b9\u09c0\u09a4\u09be\u09b0 \u09a4\u09a5\u09cd\u09af \u0986\u09aa\u09a1\u09c7\u099f \u0995\u09b0\u09c1\u09a8",
    backTo: "/dashboard/recipients",
  },
  {
    match: (pathname) => pathname === "/dashboard/transactions",
    titleEn: "Transactions",
    titleBn: "\u09b2\u09c7\u09a8\u09a6\u09c7\u09a8",
    subtitleEn: "Review and manage your transactions",
    subtitleBn: "\u0986\u09aa\u09a8\u09be\u09b0 \u09b2\u09c7\u09a8\u09a6\u09c7\u09a8 \u09aa\u09b0\u09cd\u09af\u09be\u09b2\u09cb\u099a\u09a8\u09be \u0993 \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8",
  },
  {
    match: (pathname) => pathname === "/dashboard/verification",
    titleEn: "KYC Verification",
    titleBn: "\u0995\u09c7\u0993\u09af\u09bc\u09be\u0987\u09b8\u09bf \u09af\u09be\u099a\u09be\u0987",
    subtitleEn: "Submit and review your verification details",
    subtitleBn: "\u09af\u09be\u099a\u09be\u0987\u09c7\u09b0 \u09a4\u09a5\u09cd\u09af \u099c\u09ae\u09be \u0993 \u09aa\u09b0\u09cd\u09af\u09be\u09b2\u09cb\u099a\u09a8\u09be \u0995\u09b0\u09c1\u09a8",
  },
];

const DashboardNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const name = user.name || "User";
  const isCustomer = user.role === "customer";
  const [language, setLanguage] = useState(() =>
    isCustomer
      ? localStorage.getItem("customerSidebarLanguage") || "bn"
      : "en"
  );

  useEffect(() => {
    if (!isCustomer) {
      return undefined;
    }

    const syncLanguage = () => {
      setLanguage(localStorage.getItem("customerSidebarLanguage") || "bn");
    };

    window.addEventListener("customer-sidebar-language-change", syncLanguage);

    return () => {
      window.removeEventListener(
        "customer-sidebar-language-change",
        syncLanguage
      );
    };
  }, [isCustomer]);

  const currentHeader =
    headerConfig.find((item) => item.match(location.pathname)) || {
      titleEn: "Dashboard",
      titleBn: "\u09a1\u09cd\u09af\u09be\u09b6\u09ac\u09cb\u09b0\u09cd\u09a1",
      subtitleEn: "Manage your account",
      subtitleBn: "\u0986\u09aa\u09a8\u09be\u09b0 \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09aa\u09b0\u09bf\u099a\u09be\u09b2\u09a8\u09be \u0995\u09b0\u09c1\u09a8",
    };

  const ActionIcon = currentHeader.action?.icon;
  const title =
    isCustomer && language === "bn"
      ? currentHeader.titleBn || currentHeader.titleEn
      : currentHeader.titleEn;
  const subtitle =
    location.pathname === "/dashboard"
      ? `${
          isCustomer && language === "bn"
            ? currentHeader.subtitleBn || currentHeader.subtitleEn
            : currentHeader.subtitleEn
        }, ${name}`
      : isCustomer && language === "bn"
        ? currentHeader.subtitleBn || currentHeader.subtitleEn
        : currentHeader.subtitleEn;

  const toggleLanguage = () => {
    const nextLanguage = language === "bn" ? "en" : "bn";
    setLanguage(nextLanguage);
    localStorage.setItem("customerSidebarLanguage", nextLanguage);
    window.dispatchEvent(new Event("customer-sidebar-language-change"));
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {currentHeader.backTo && (
          <button
            type="button"
            onClick={() => navigate(currentHeader.backTo)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isCustomer && (
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Languages className="w-4 h-4" />
            <span>{language === "bn" ? "\u09ac\u09be\u0982\u09b2\u09be" : "English"}</span>
          </button>
        )}

        <div className="relative cursor-pointer">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
            3
          </span>
        </div>

        <div
          onClick={() => navigate("/dashboard/profile")}
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
        >
          <UserCircle className="w-6 h-6 text-gray-700" />
          <span className="text-sm font-medium hidden sm:block">{name}</span>
        </div>

        {currentHeader.action && (
          <button
            type="button"
            onClick={() => currentHeader.action.onClick(navigate)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {isCustomer && language === "bn"
              ? currentHeader.action.labelBn || currentHeader.action.labelEn
              : currentHeader.action.labelEn}
          </button>
        )}
      </div>
    </header>
  );
};

export default DashboardNavbar;
