import React, { useEffect, useState } from "react";
import axios from "axios";

const Setting = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";
const [selectedApi, setSelectedApi] = useState("sms");
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draftValues, setDraftValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [otpRow, setOtpRow] = useState(null);
  
const smsKeys = ["url", "api_key", "senderid", "number", "message"];
const emailKeys = ["gmail", "app_password"];
const hiddenKeys = [
  "url",
  "api_key",
  "senderid",
  "number",
  "message",
  "gmail",
  "app_password",
];




const saveOtpType = async (type) => {
  try {
    if (!otpRow) return;

    await axios.patch(
      `http://localhost:8081/auth/settings/${otpRow.id}`,
      { setting_value: type },
      { withCredentials: true }
    );
  } catch (err) {
    console.error("Failed to update OTP type", err);
  }
};
const handleOtpTypeChange = (type) => {
  setSelectedApi(type);
  saveOtpType(type);
};
const smsSettings = settings.filter((s) =>
  smsKeys.includes(s.setting_key)
);

const emailSettings = settings.filter((s) =>
  emailKeys.includes(s.setting_key)
);
useEffect(() => {
  const fetchOtpType = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8081/auth/settings",
        { withCredentials: true }
      );

      const otpSetting = res.data.find(
        (s) => s.setting_key === "otp_type"
      );

      if (otpSetting) {
        setSelectedApi(otpSetting.setting_value);
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchOtpType();
}, []);
 useEffect(() => {
  const loadSettings = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8081/auth/settings",
        { withCredentials: true }
      );

      const rows = Array.isArray(res.data) ? res.data : [];
      setSettings(rows);

      const initialDrafts = rows.reduce((acc, row) => {
        acc[row.id] = row.setting_value;
        return acc;
      }, {});
      setDraftValues(initialDrafts);

      // ✅ FIX: OTP logic here (correct scope)
      const otpSetting = rows.find(
        (s) => s.setting_key === "otp_type"
      );

      if (otpSetting) {
        setOtpRow(otpSetting);
        setSelectedApi(otpSetting.setting_value);
      }

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
  <div className="p-6">
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl shadow-xl border border-gray-200 overflow-hidden">
      
      <div className="border-b px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">
          Manage application value limitations from the backend table
        </p>
      </div>
<h2 className="text-xl font-bold text-gray-900 px-6 mt-2 uppercase">Transaction Limitations</h2>
      <div className="overflow-x-auto p-4">
        <table className="min-w-full text-sm rounded-xl overflow-hidden">
          
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700">
            <tr>
              <th className="p-4 border">Key</th>
              <th className="p-4 border">Value Limitation</th>
              <th className="p-4 border">Updated At</th>
              <th className="p-4 border">Action</th>
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
              settings
                .filter((row) => !hiddenKeys.includes(row.setting_key))
                .map((row) => {
                  const isEditing = editingId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className="text-center hover:bg-white/60 transition"
                    >
                      <td className="p-4 border font-medium text-left">
                        {row.setting_label}
                      </td>

                      <td className="p-4 border">
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
                          className={`w-full rounded-lg px-3 py-2 border transition ${
                            isEditing
                              ? "bg-white border-blue-400 shadow-sm"
                              : "bg-gray-100 border-gray-200 text-gray-600"
                          }`}
                        />
                      </td>

                      <td className="p-4 border">
                        {row.updated_at
                          ? new Date(row.updated_at).toLocaleString()
                          : "N/A"}
                      </td>

                      <td className="p-4 border">
                        <button
                          onClick={() => handleActionClick(row)}
                          disabled={savingId === row.id}
                          className={`rounded-lg px-4 py-2 text-white shadow-md transition ${
                            isEditing
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
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

      {/* SMS + EMAIL SECTION */}
      <h2 className="text-xl font-bold text-gray-900 px-6">API CREDENTIAL</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        
        {/* SMS */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl shadow-lg border overflow-hidden">
          <div className="border-b px-4 py-3 bg-gradient-to-r from-blue-100 to-blue-50">
            <h3 className="font-semibold text-blue-700">SMS Settings</h3>
          </div>

          <table className="min-w-full text-sm">
            <tbody>
              {smsSettings.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <tr key={row.id} className="hover:bg-white/60 transition">
                    <td className="p-4 border font-medium w-1/3">
                      {row.setting_label}
                    </td>

                    <td className="p-4 border">
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
                        className={`w-full rounded-lg px-3 py-2 border ${
                          isEditing
                            ? "bg-white border-blue-400 shadow-sm"
                            : "bg-gray-100 border-gray-200"
                        }`}
                      />
                    </td>

                    <td className="p-4 border text-center">
                      <button
                        onClick={() => handleActionClick(row)}
                        className={`px-4 py-2 text-white rounded-lg shadow ${
                          isEditing
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      >
                        {isEditing ? "Save" : "Edit"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* EMAIL */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl shadow-lg border overflow-hidden">
          <div className="border-b px-4 py-3 bg-gradient-to-r from-purple-100 to-purple-50">
            <h3 className="font-semibold text-purple-700">Email Settings</h3>
          </div>

          <table className="min-w-full text-sm">
            <tbody>
              {emailSettings.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <tr key={row.id} className="hover:bg-white/60 transition">
                    <td className="p-4 border font-medium w-1/3">
                      {row.setting_label}
                    </td>

                    <td className="p-4 border">
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
                        className={`w-full rounded-lg px-3 py-2 border ${
                          isEditing
                            ? "bg-white border-purple-400 shadow-sm"
                            : "bg-gray-100 border-gray-200"
                        }`}
                      />
                    </td>

                    <td className="p-4 border text-center">
                      <button
                        onClick={() => handleActionClick(row)}
                        className={`px-4 py-2 text-white rounded-lg shadow ${
                          isEditing
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      >
                        {isEditing ? "Save" : "Edit"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
           <div className="flex items-center justify-center mt-4">
            <h2 className="mr-2">Select OTP Type</h2>
  <div className="flex items-center bg-gray-200 rounded-full p-1 w-64 relative">
    
    {/* Sliding Background */}
    <div
      className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-white shadow-md transition-all duration-300 ${
        selectedApi === "email" ? "left-1/2" : "left-0"
      }`}
    ></div>

    {/* SMS Button */}
    
    <button
     onClick={() => handleOtpTypeChange("sms")}
      className={`w-1/2 z-10 text-sm font-medium py-2 rounded-full transition ${
        selectedApi === "sms"
          ? "text-blue-600"
          : "text-gray-600"
      }`}
    >
      SMS
    </button>

    {/* Email Button */}
    <button
      onClick={() => handleOtpTypeChange("email")}
      className={`w-1/2 z-10 text-sm font-medium py-2 rounded-full transition ${
        selectedApi === "email"
          ? "text-purple-600"
          : "text-gray-600"
      }`}
    >
      Email
    </button>
  </div>
</div>
        </div>

      </div>
    </div>
   
  </div>
);
};

export default Setting;
