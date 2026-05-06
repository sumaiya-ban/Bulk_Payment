import React, { useCallback, useEffect, useState } from "react";

const API_BASE = "http://localhost:8081/api/support-chat";

const SupportChatPage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const customerUserId = user.id || null;
  const customerName = user.name || "";
  const customerEmail = user.email || "";

  const getConversationQuery = useCallback(() => {
    if (isAdmin) {
      return "?role=admin";
    }

    const params = new URLSearchParams();
    if (user.id) {
      params.set("user_id", user.id);
    }
    if (user.email) {
      params.set("email", user.email);
    }

    return `?${params.toString()}`;
  }, [isAdmin, user.email, user.id]);

  const getMessageQuery = useCallback(() => {
    if (isAdmin) {
      return "?role=admin";
    }

    const params = new URLSearchParams();
    params.set("role", "customer");
    if (user.id) {
      params.set("user_id", user.id);
    }
    if (user.email) {
      params.set("email", user.email);
    }

    return `?${params.toString()}`;
  }, [isAdmin, user.email, user.id]);

  const ensureCustomerConversation = useCallback(async () => {
    if (isAdmin || !customerName || !customerEmail) {
      return null;
    }

    const response = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_user_id: customerUserId,
        customer_name: customerName,
        customer_email: customerEmail,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to start support chat");
    }

    return response.json();
  }, [customerEmail, customerName, customerUserId, isAdmin]);

  const fetchConversations = useCallback(async ({ preserveSelection = true } = {}) => {
    const response = await fetch(`${API_BASE}/conversations${getConversationQuery()}`);
    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch conversations");
    }

    setConversations(data);

    if (data.length === 0) {
      setActiveConversation(null);
      return;
    }

    setActiveConversation((prev) => {
      if (!preserveSelection || !prev) {
        return data[0];
      }

      return data.find((item) => item.id === prev.id) || data[0];
    });
  }, [getConversationQuery]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const response = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages${getMessageQuery()}`
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch messages");
    }

    setMessages(data.messages || []);
    if (data.conversation) {
      setActiveConversation(data.conversation);
    }
  }, [getMessageQuery]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setLoading(true);
      setError("");

      try {
        if (!isAdmin) {
          await ensureCustomerConversation();
        }

        if (isMounted) {
          await fetchConversations({ preserveSelection: false });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load support chat");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [ensureCustomerConversation, fetchConversations, isAdmin]);

  useEffect(() => {
    if (!activeConversation?.id) {
      setMessages([]);
      return undefined;
    }

    let cancelled = false;

    const loadMessages = async () => {
      try {
        await fetchMessages(activeConversation.id);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load messages");
        }
      }
    };

    loadMessages();
    const intervalId = window.setInterval(loadMessages, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeConversation?.id, fetchMessages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchConversations().catch((err) => {
        setError(err.message || "Failed to refresh conversations");
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchConversations]);

  const handleSendMessage = async () => {
    const trimmedMessage = draftMessage.trim();

    if (!activeConversation?.id || !trimmedMessage) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/conversations/${activeConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_role: isAdmin ? "admin" : "customer",
            sender_name: user.name || (isAdmin ? "Admin" : "Customer"),
            message: trimmedMessage,
            user_id: user.id || null,
            email: user.email || "",
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessages(data.messages || []);
      setDraftMessage("");
      await fetchConversations();
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  };

  const EmptyState = (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">
      {isAdmin
        ? "No support conversations yet. New customer chats will appear here."
        : "Your support thread is being prepared. Refresh the page if it does not appear."}
    </div>
  );

  if (loading) {
    return <div className="p-6 text-slate-600">Loading support chat...</div>;
  }

  if (!isAdmin && (!user.name || !user.email)) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Please complete your profile with a name and email before using support chat.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-100 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isAdmin ? "Support Inbox" : "Support Chat"}
          </h2>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? "Reply to customer questions in one place."
              : "Chat with the admin team and get replies here."}
          </p>
        </div>

        <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          Refreshes every few seconds
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isAdmin ? (
        <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Conversations</h3>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-500">No customer chats yet.</div>
              ) : (
                conversations.map((conversation) => {
                  const isActive = activeConversation?.id === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setActiveConversation(conversation)}
                      className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${
                        isActive ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{conversation.customer_name}</p>
                          <p className={`text-xs ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                            {conversation.customer_email}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                            isActive
                              ? "bg-white/10 text-white"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {conversation.status}
                        </span>
                      </div>

                      <p className={`mt-3 line-clamp-2 text-sm ${isActive ? "text-slate-200" : "text-slate-600"}`}>
                        {conversation.last_message || "No messages yet"}
                      </p>

                      <p className="mt-3 text-[11px] text-slate-400">
                        {formatTime(conversation.last_message_at || conversation.created_at)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {!activeConversation ? (
              EmptyState
            ) : (
              <>
                <div className="border-b border-slate-100 px-6 py-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {activeConversation.customer_name}
                  </h3>
                  <p className="text-sm text-slate-500">{activeConversation.customer_email}</p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 md:px-6">
                  {messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      No messages yet in this conversation.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const fromAdmin = message.sender_role === "admin";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xl rounded-3xl px-4 py-3 shadow-sm ${
                              fromAdmin
                                ? "bg-slate-900 text-white"
                                : "bg-white text-slate-900"
                            }`}
                          >
                            <p className={`mb-1 text-xs font-semibold ${fromAdmin ? "text-slate-300" : "text-slate-500"}`}>
                              {message.sender_name}
                            </p>
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                            <p className="mt-2 text-[11px] text-slate-400">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-100 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <textarea
                      rows={3}
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Write your reply..."
                      className="min-h-[88px] flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending || !draftMessage.trim()}
                      className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      ) : !activeConversation ? (
        EmptyState
      ) : (
        <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Conversation with Admin</h3>
            <p className="text-sm text-slate-500">
              Messages from you and the admin team appear here.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 md:px-6">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                Start the conversation and the admin will reply here.
              </div>
            ) : (
              messages.map((message) => {
                const fromCustomer = message.sender_role === "customer";

                return (
                  <div
                    key={message.id}
                    className={`flex ${fromCustomer ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xl rounded-3xl px-4 py-3 shadow-sm ${
                        fromCustomer
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-900"
                      }`}
                    >
                      <p className={`mb-1 text-xs font-semibold ${fromCustomer ? "text-emerald-100" : "text-slate-500"}`}>
                        {message.sender_name}
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                      <p className={`mt-2 text-[11px] ${fromCustomer ? "text-emerald-100" : "text-slate-400"}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                rows={3}
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message to admin..."
                className="min-h-[88px] flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending || !draftMessage.trim()}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChatPage;
