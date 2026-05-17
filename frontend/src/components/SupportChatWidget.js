import React, { useCallback, useEffect, useState } from "react";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api/support-chat`;
const GUEST_STORAGE_KEY = "support-chat-guest";

const SupportChatWidget = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedInCustomer = user.role === "customer";

  const [isOpen, setIsOpen] = useState(false);
  const [guestInfo, setGuestInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  });
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const customerUserId = isLoggedInCustomer ? user.id || null : null;
  const customerName = isLoggedInCustomer ? user.name || "" : guestInfo.name || "";
  const customerEmail = isLoggedInCustomer ? user.email || "" : guestInfo.email || "";

  const getMessageQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("role", "customer");

    if (customerUserId) {
      params.set("user_id", customerUserId);
    }

    if (customerEmail) {
      params.set("email", customerEmail);
    }

    return `?${params.toString()}`;
  }, [customerEmail, customerUserId]);

  const saveGuestInfo = (nextValue) => {
    setGuestInfo(nextValue);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextValue));
  };

  const ensureConversation = useCallback(async (identity) => {
    const response = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(identity),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Failed to start support chat");
    }

    setConversation(data);
    return data;
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    try {
      const response = await fetch(
        `${API_BASE}/conversations/${conversationId}/messages${getMessageQuery()}`
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to load messages");
      }

      setMessages(data.messages || []);
    } finally {
      setLoadingMessages(false);
    }
  }, [getMessageQuery]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: customerName || prev.name,
      email: customerEmail || prev.email,
    }));
  }, [customerEmail, customerName]);

  useEffect(() => {
    if (!isOpen || !customerName || !customerEmail) {
      return undefined;
    }

    let cancelled = false;
    const identity = {
      customer_user_id: customerUserId,
      customer_name: customerName,
      customer_email: customerEmail,
    };

    const initialize = async () => {
      try {
        const currentConversation = await ensureConversation(identity);
        if (!cancelled) {
          await loadMessages(currentConversation.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load support chat");
        }
      }
    };

    initialize();

    const intervalId = window.setInterval(async () => {
      try {
        const currentConversation = conversation || (await ensureConversation(identity));
        if (!cancelled) {
          await loadMessages(currentConversation.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to refresh chat");
        }
      }
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    conversation,
    customerEmail,
    customerName,
    customerUserId,
    ensureConversation,
    isOpen,
    loadMessages,
  ]);

  const handleSend = async () => {
    const trimmedMessage = form.message.trim();
    const trimmedName = (isLoggedInCustomer ? user.name : form.name).trim();
    const trimmedEmail = (isLoggedInCustomer ? user.email : form.email).trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setError("Name, email, and message are required.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const identity = {
        customer_user_id: isLoggedInCustomer ? user.id || null : null,
        customer_name: trimmedName,
        customer_email: trimmedEmail,
      };

      if (!isLoggedInCustomer) {
        saveGuestInfo({ name: trimmedName, email: trimmedEmail });
      }

      const currentConversation = conversation || (await ensureConversation(identity));

      const response = await fetch(
        `${API_BASE}/conversations/${currentConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_role: "customer",
            sender_name: trimmedName,
            message: trimmedMessage,
            user_id: identity.customer_user_id,
            email: trimmedEmail,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessages(data.messages || []);
      setConversation(currentConversation);
      setForm((prev) => ({
        ...prev,
        name: trimmedName,
        email: trimmedEmail,
        message: "",
      }));
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-slate-800"
      >
        <span className="text-base">Chat</span>
        <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-900">
          Live
        </span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[560px] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="bg-slate-900 px-5 py-4 text-white">
            <p className="text-lg font-semibold">Support Chat</p>
            <p className="text-sm text-slate-300">Send a message and admin can reply here.</p>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
            {error && (
              <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {!isLoggedInCustomer && (
              <div className="mb-4 grid gap-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <input
                  type="email"
                  placeholder="Your email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>
            )}

            {loadingMessages ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                Start a chat and the admin will see it in the support inbox.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const fromCustomer = message.sender_role === "customer";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${fromCustomer ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                          fromCustomer
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-900"
                        }`}
                      >
                        <p className={`mb-1 text-[11px] font-semibold ${fromCustomer ? "text-emerald-100" : "text-slate-500"}`}>
                          {message.sender_name}
                        </p>
                        <p className="whitespace-pre-wrap leading-6">{message.message}</p>
                        <p className={`mt-2 text-[10px] ${fromCustomer ? "text-emerald-100" : "text-slate-400"}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex items-end gap-3">
              <textarea
                rows={3}
                placeholder="Type your message..."
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                className="min-h-[88px] flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
