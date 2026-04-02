import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);

  const [form, setForm] = useState({
    receiver_id: "",
    receiver_input: "",
    account_type: "",
    customer_id: "",
    amount: "",
  });

  const [filters, setFilters] = useState({
    status: "",
    date: "",
    search: "",
  });

  const [customers, setCustomers] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [amountError, setAmountError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const users_id = user.id || "User";
  const name = user.name || "User";
  const isAdmin = user.role === "admin";

  const transactionRoundLimitation =
    settings.find(
      (item) => item.setting_key === "transaction_round_limitation"
    )?.setting_value || "";
  const moneyLimitation =
    settings.find((item) => item.setting_key === "money_limitation")
      ?.setting_value || "";
  const totalMoneyLimitation =
    settings.find((item) => item.setting_key === "total_money_limitation")
      ?.setting_value || "";

  useEffect(() => {
    if (!settings.length) {
      return;
    }

    console.log("transactionRoundLimitation:", transactionRoundLimitation);
    console.log("moneyLimitation:", moneyLimitation);
    console.log("totalMoneyLimitation:", totalMoneyLimitation);
  }, [
    settings,
    transactionRoundLimitation,
    moneyLimitation,
    totalMoneyLimitation,
  ]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "success":
      case "send":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "pending":
      default:
        return "bg-orange-100 text-orange-700";
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
    fetchReceivers();
    fetchSettingsForLog();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:8081/auth/transactions");
      setTransactions(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:8081/auth/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReceivers = async () => {
    try {
      const res = await axios.get("http://localhost:8081/auth/receivers");
      setReceivers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSettingsForLog = async () => {
    try {
      const res = await axios.get("http://localhost:8081/auth/settings", {
        withCredentials: true,
      });
      setSettings(Array.isArray(res.data) ? res.data : []);
      console.log("Settings data:", res.data);
    } catch (error) {
      console.error("Failed to fetch settings for log:", error);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.patch(`http://localhost:8081/auth/transaction/${id}`, { status });
      await fetchTransactions();
      alert(`Transaction marked as ${status}. Email notification attempted.`);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to update transaction status");
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setAmountError("");

  // Always set logged-in customer ID
  const dataToSend = {
    ...form,
    customer_id: users_id, // sender is always logged-in user
  };

  // Validation: account_type, amount, and either receiver_id or receiver_input
  if (!dataToSend.account_type || !dataToSend.amount || (!dataToSend.receiver_id && !dataToSend.receiver_input)) {
    alert("Please fill all required fields");
    return;
  }

  const enteredAmount = Number(dataToSend.amount);
  const moneyLimitValue = Number(moneyLimitation);

  if (
    Number.isFinite(moneyLimitValue) &&
    moneyLimitValue > 0 &&
    enteredAmount > moneyLimitValue
  ) {
    setAmountError(
      `Amount exceeded. Maximum allowed amount is ${moneyLimitation}.`
    );
    return;
  }

  try {
    console.log("Sending transaction:", {
      customer_id: dataToSend.customer_id,
      account_type: dataToSend.account_type,
      amount: dataToSend.amount,
      receiver_id: dataToSend.receiver_id || null,
      new_receiver: dataToSend.receiver_id ? null : dataToSend.receiver_input,
    });

    await axios.post("http://localhost:8081/auth/transaction", {
      customer_id: dataToSend.customer_id,
      account_type: dataToSend.account_type,
      amount: dataToSend.amount,
      receiver_id: dataToSend.receiver_id || null,
      new_receiver: dataToSend.receiver_id ? null : dataToSend.receiver_input,
    });

    alert("Transaction created successfully");

    setForm({
      receiver_id: "",
      receiver_input: "",
      account_type: "",
      amount: "",
    });

    setShowForm(false);
    fetchTransactions();
  } catch (error) {
    console.error(error);
    alert(error.response?.data?.error || "Failed to create transaction");
  }
};

  const filteredData = transactions
    .filter((tx) => (isAdmin ? true : tx.customer_id === Number(users_id)))
    .filter((tx) => (filters.status ? tx.status === filters.status : true))
    .filter((tx) => {
      if (!filters.date) return true;
      const txDate = new Date(tx.tnx_time).toISOString().split("T")[0];
      return txDate === filters.date;
    })
    .filter((tx) => {
      if (!filters.search) return true;
      const search = filters.search.toLowerCase();
      return tx.receiver_name?.toLowerCase().includes(search) || tx.receiver_number?.includes(search);
    });

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedRows(checked ? filteredData.map((t) => t.id) : []);
  };

  const downloadPDF = () => {
    const selected = filteredData.filter((t) => selectedRows.includes(t.id));
    if (selected.length === 0) {
      alert("Select rows first");
      return;
    }

    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID","Customer","Receiver","Number","Amount","Transaction ID","Status","Account Type","Time"]],
      body: selected.map((t) => [
        t.id,
        t.customer_name || "Unknown",
        t.receiver_name || "Unknown",
        t.receiver_number || "N/A",
        t.amount,
        t.tnx_id,
        t.status,
        t.account_type,
        new Date(t.tnx_time).toLocaleString(),
      ]),
    });
    doc.save("transactions.pdf");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Transactions</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {showForm ? "Close Form" : "Make Transaction"}
        </button>
      </div>

      {/* <div className="mb-6 overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="p-3 border">Key</th>
              <th className="p-3 border">Value Limitation</th>
              <th className="p-3 border">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {settings.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 border text-center text-gray-500">
                  No settings data found
                </td>
              </tr>
            ) : (
              settings.map((setting) => (
                <tr key={setting.id}>
                  <td className="p-3 border">{setting.setting_label}</td>
                  <td className="p-3 border">{setting.setting_value}</td>
                  <td className="p-3 border">
                    {setting.updated_at
                      ? new Date(setting.updated_at).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div> */}

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">New Transaction</h2>
          <form className="flex flex-wrap gap-4 items-end" onSubmit={handleSubmit}>

            {/* Sender */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Sender Name</label>
              <div className="border rounded px-3 py-3 w-48">
                <p className="text-xs text-gray-500">{name}</p>
              </div>
            </div>

            {/* Receiver */}
            <div className="flex flex-col relative w-48">
              <label className="mb-1 font-medium">Receiver</label>
              <input
                type="text"
                placeholder="Search or enter number"
                className="border rounded px-3 py-2"
                value={form.receiver_input || ""}
                onChange={(e) => {
                  setForm({...form, receiver_input: e.target.value, receiver_id: "" });
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && (
                <div className="absolute top-full left-0 w-full bg-white border rounded shadow max-h-40 overflow-y-auto z-10">
                  {receivers.filter(r =>
                    r.name.toLowerCase().includes(form.receiver_input?.toLowerCase() || "") ||
                    r.number?.includes(form.receiver_input || "")
                  ).map(r => (
                    <div key={r.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm({...form, receiver_id: r.id, receiver_input: r.name});
                        setShowDropdown(false);
                      }}>
                      {r.name} ({r.number})
                    </div>
                  ))}
                  {receivers.filter(r =>
                    r.name.toLowerCase().includes(form.receiver_input?.toLowerCase() || "") ||
                    r.phone?.includes(form.receiver_input || "")
                  ).length === 0 && form.receiver_input && (
                    <div className="px-3 py-2 text-blue-600">Use "{form.receiver_input}" as new receiver</div>
                  )}
                </div>
              )}
            </div>

            {/* Account Type */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Account Type</label>
              <select
                className="border rounded px-3 py-2 w-48"
                value={form.account_type}
                onChange={(e) => setForm({...form, account_type: e.target.value})}
              >
                <option value="">Select Account</option>
                <option value="bkash">Bkash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
              </select>
            </div>

            {/* Amount */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Amount</label>
              <input
                type="number"
                className={`rounded px-3 py-2 w-40 border ${
                  amountError ? "border-red-500 bg-red-50" : ""
                }`}
                value={form.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  const parsedValue = value === "" ? "" : parseFloat(value);

                  setForm({ ...form, amount: parsedValue });

                  const moneyLimitValue = Number(moneyLimitation);

                  if (
                    value !== "" &&
                    Number.isFinite(moneyLimitValue) &&
                    moneyLimitValue > 0 &&
                    Number(parsedValue) > moneyLimitValue
                  ) {
                    setAmountError(
                      ` Maximum amount is ${moneyLimitation}.`
                    );
                  } else {
                    setAmountError("");
                  }
                }}
              />
              {amountError ? (
                <p className="mt-1 text-sm text-red-600">{amountError}</p>
              ) : null}
            </div>

            {/* Submit */}
            <div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Send Money Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Download */}
      <div className="flex gap-4 mb-4">
        <select className="border px-3 py-2 rounded" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="send">Success</option>
          <option value="failed">Failed</option>
        </select>

        <input type="date" className="border px-3 py-2 rounded" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
        <input type="text" className="border px-3 py-2 rounded" placeholder="Search name or number" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />

        <button className="border px-3 py-2 rounded flex items-center gap-2" onClick={downloadPDF}>
          Download Data Table <Download size={16} />
        </button>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">
                <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
              </th>
              {/* <th className="p-3 border">আইডি</th> */}
              <th className="p-3 border">কাস্টমার</th>
              <th className="p-3 border">গ্রহীতা</th>
              <th className="p-3 border">গ্রহীতার নম্বর</th>
              <th className="p-3 border">পরিমাণ</th>
              <th className="p-3 border">ট্রানজেকশন আইডি</th>
              <th className="p-3 border">স্টেটাস</th>
              <th className="p-3 border">অ্যাকাউন্ট ধরন</th>
              <th className="p-3 border">সময়</th>
              <th className="p-3 border">notes</th>
              <th className="p-3 border">অ্যাকশন</th>
              
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="p-6 text-center text-gray-500">Loading transactions...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="11" className="p-6 text-center text-gray-500">No data inserted</td>
              </tr>
            ) : (
              filteredData.map((tx) => (
                <tr key={tx.id} className="text-center">
                  <td className="p-3 border">
                    <input type="checkbox" checked={selectedRows.includes(tx.id)} onChange={() => handleRowSelect(tx.id)} />
                  </td>
                  {/* <td className="p-3 border">{tx.id}</td> */}
                  <td className="p-3 border">{tx.customer_name || "Unknown"}</td>
                  <td className="p-3 border">{tx.receiver_name || "Unknown"}</td>
                  <td className="p-3 border">{tx.receiver_number || "N/A"}</td>
                  <td className="p-3 border">{tx.amount}</td>
                  <td className="p-3 border">{tx.tnx_id}</td>
                  <td className="px-6 py-4 border whitespace-nowrap text-center text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 border">{tx.account_type}</td>
                  <td className="p-3 border">{new Date(tx.tnx_time).toLocaleString()}</td>
                  <td className="p-3 border">{tx.notes}</td>
                  <td className="p-3 border">
                    {isAdmin && tx.status === "pending" ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(tx.id, "send")}
                          className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                        >
                          Send
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(tx.id, "failed")}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Failed
                        </button>
                      </div>
                    ) : isAdmin ? (
                      <span className="text-gray-500">Updated</span>
                    ) : (
                      <span className="text-gray-500">Admin only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transaction;
