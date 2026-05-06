import { Bell, Plus, Send, UserCircle, ArrowLeft, Languages } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

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
  const profileImageUrl = user.image
    ? `http://localhost:8081/uploads/profiles/${user.image}`
    : "";
  const isCustomer = user.role === "customer";
  const userId = user.id;
 const [language, setLanguage] = useState(() => {
  const savedLang = localStorage.getItem("customerSidebarLanguage");

  // Always default to Bangla if nothing is saved
  if (!savedLang) {
    localStorage.setItem("customerSidebarLanguage", "bn");
    return "bn";
  }

  return savedLang;
});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!userId) {
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:8081/auth/notifications/${userId}`
      );

      const storageKey = `notification-toast-seen-${userId}`;
      const seenNotificationIds = new Set(
        JSON.parse(localStorage.getItem(storageKey) || "[]")
      );
      const unreadNewNotifications = res.data.filter(
        (item) => !item.is_read && !seenNotificationIds.has(String(item.id))
      );

      if (unreadNewNotifications.length > 0) {
        const latestNotification = unreadNewNotifications[0];
        const normalizedTitle = String(latestNotification.title || "").toLowerCase();
        const isFailedNotification =
          latestNotification.transaction_status === "failed" ||
          normalizedTitle.includes("failed");
        const isRequestNotification = normalizedTitle.includes("request");

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: isFailedNotification
            ? "error"
            : isRequestNotification
            ? "info"
            : "success",
          title: latestNotification.title,
          text: latestNotification.message,
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
          background: isFailedNotification
            ? "#fee2e2"
            : isRequestNotification
            ? "#dbeafe"
            : "#dcfce7",
          color: isFailedNotification
            ? "#b91c1c"
            : isRequestNotification
            ? "#1d4ed8"
            : "#166534",
        });

        unreadNewNotifications.forEach((item) =>
          seenNotificationIds.add(String(item.id))
        );
        localStorage.setItem(
          storageKey,
          JSON.stringify([...seenNotificationIds])
        );
      }

      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
  if (!isCustomer) {
    return undefined;
  }

  const syncLanguage = () => {
    const lang = localStorage.getItem("customerSidebarLanguage") || "bn";
    setLanguage(lang);
  };

  window.addEventListener("customer-sidebar-language-change", syncLanguage);

  return () => {
    window.removeEventListener(
      "customer-sidebar-language-change",
      syncLanguage
    );
  };
}, [isCustomer]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [userId]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const formatNotificationTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  };

  const handleBellClick = () => {
    if (!showNotifications) {
      fetchNotifications();
    }

    setShowNotifications((prev) => !prev);
  };

  const markAllNotificationsAsRead = async () => {
    if (!userId || unreadCount === 0) {
      return;
    }

    try {
      await axios.patch(`http://localhost:8081/auth/notifications/${userId}/read`);
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: 1 }))
      );
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

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

  // Trigger a shared event for the sidebar to listen
  window.dispatchEvent(new Event("customer-sidebar-language-change"));
};

  return (
    <header className="sticky top-0 z-50 h-16 bg-green-100 flex items-center justify-between px-6 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        {currentHeader.backTo && (
          <button
            type="button"
            onClick={() => navigate(currentHeader.backTo)}
            className="p-2 rounded hover:bg-blue-700 text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-900 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
       
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-lg border border-slate-900 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-blue-700 transition"
          >
            <Languages className="w-4 h-4" />
            <span>{language === "bn" ? "\u09ac\u09be\u0982\u09b2\u09be" : "English"}</span>
          </button>
        

        <div className="relative">
          <button
            type="button"
            onClick={handleBellClick}
            className="relative rounded-full p-2 hover:bg-blue-700 transition"
          >
            <Bell className="w-5 h-5 text-slate-900" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 bg-red-500 text-white text-[10px] px-1 rounded-full text-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-slate-900 shadow-lg z-50">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                      : "No unread updates"}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-900">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`border-b px-4 py-3 last:border-b-0 ${
                        item.is_read ? "bg-white" : "bg-blue-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-900">
                        {item.message}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-900">
                        {formatNotificationTime(item.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div
          onClick={() => navigate("/dashboard/profile")}
          className="flex items-center gap-2 cursor-pointer hover:bg-blue-700 px-2 py-1 rounded transition text-slate-900"
        >
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border border-blue-300"
            />
          ) : (
            <UserCircle className="w-6 h-6 text-blue-100" />
          )}
          <span className="text-sm font-medium hidden sm:block text-slate-900">{name}</span>
        </div>

        {currentHeader.action && (
          <button
            type="button"
            onClick={() => currentHeader.action.onClick(navigate)}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:brightness-95 transition"
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
