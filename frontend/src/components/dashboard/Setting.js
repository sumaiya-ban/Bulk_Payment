import React, { useEffect, useState } from "react";
import axios from "axios";

const Setting = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draftValues, setDraftValues] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await axios.get("http://localhost:8081/auth/settings", {
          withCredentials: true,
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        setSettings(rows);

        const initialDrafts = rows.reduce((acc, row) => {
          acc[row.id] = row.setting_value;
          return acc;
        }, {});

        setDraftValues(initialDrafts);
      } catch (err) {
        console.error("Failed to load settings:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleActionClick = async (row) => {
    if (editingId !== row.id) {
      setEditingId(row.id);
      return;
    }

    try {
      setSavingId(row.id);

      const res = await axios.patch(
        `http://localhost:8081/auth/settings/${row.id}`,
        { setting_value: draftValues[row.id] },
        { withCredentials: true }
      );

      const updatedSetting = res.data?.setting;

      if (updatedSetting) {
        setSettings((prev) =>
          prev.map((item) => (item.id === row.id ? updatedSetting : item))
        );
        setDraftValues((prev) => ({
          ...prev,
          [row.id]: updatedSetting.setting_value,
        }));
      }

      setEditingId(null);
    } catch (err) {
      console.error("Failed to save setting:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to save setting");
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm text-gray-500">
        Only admin can manage settings.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">
          Manage application value limitations from the backend table
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="p-3 border">Key</th>
              <th className="p-3 border">Value Limitation</th>
              <th className="p-3 border">Updated At</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center text-gray-500 border" colSpan="4">
                  Loading settings...
                </td>
              </tr>
            ) : settings.length === 0 ? (
              <tr>
                <td className="p-4 text-center text-gray-500 border" colSpan="4">
                  No settings found.
                </td>
              </tr>
            ) : (
              settings.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <tr key={row.id} className="text-center">
                    <td className="p-3 border font-medium text-left">
                      {row.setting_label}
                    </td>
                    <td className="p-3 border">
                      <input
                        type="text"
                        value={draftValues[row.id] ?? ""}
                        readOnly={!isEditing}
                        onChange={(e) =>
                          setDraftValues((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        className={`w-full rounded-md border px-3 py-2 ${
                          isEditing
                            ? "bg-white border-blue-400"
                            : "bg-gray-100 border-gray-200 text-gray-600"
                        }`}
                      />
                    </td>
                    <td className="p-3 border">
                      {row.updated_at
                        ? new Date(row.updated_at).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() => handleActionClick(row)}
                        disabled={savingId === row.id}
                        className={`rounded-md px-4 py-2 text-white ${
                          isEditing
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {savingId === row.id
                          ? "Saving..."
                          : isEditing
                          ? "Save"
                          : "Edit"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Setting;
