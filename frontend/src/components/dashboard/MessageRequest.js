import React, { useEffect, useState } from "react";

const MessageRequest = () => {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contacts`);
    const data = await res.json();
    setContacts(data);
  };

  const sendReply = async () => {
    if (!replyMessage) return alert("Write a message");

    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selected.email,
          name: selected.name,
          message: replyMessage,
        }),
      });

      if (res.ok) {
        alert("Email sent successfully");
        setSelected(null);
        setReplyMessage("");
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold">Contact Messages</h2>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3">SL.NO</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {contacts.map((item, index) => (
              <tr key={item.id} className="border-b">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4">{item.name}</td>
                <td className="px-6 py-4">{item.email}</td>
                <td className="max-w-xs truncate px-6 py-4">{item.message}</td>
                <td className="px-6 py-4">
                  {new Date(item.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelected(item)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs text-white"
                  >
                    Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Reply to {selected.name}
            </h3>

            <textarea
              className="mb-4 w-full rounded-lg border p-3"
              rows={5}
              placeholder="Write your reply..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={sendReply}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageRequest;
