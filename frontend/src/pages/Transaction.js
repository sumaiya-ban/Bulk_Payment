import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaDownload } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
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

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const users_id = user.id || "User";
  const name = user.name || "User";

  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
    fetchReceivers();
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

 const handleSubmit = async (e) => {
  e.preventDefault();

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
    .filter((tx) => tx.customer_id === Number(users_id))
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
                className="border rounded px-3 py-2 w-40"
                value={form.amount}
                onChange={(e) => setForm({...form, amount: parseFloat(e.target.value)})}
              />
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
          <option value="success">Success</option>
        </select>

        <input type="date" className="border px-3 py-2 rounded" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
        <input type="text" className="border px-3 py-2 rounded" placeholder="Search name or number" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />

        <button className="border px-3 py-2 rounded flex items-center gap-2" onClick={downloadPDF}>
          Download Data Table <FaDownload />
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
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Customer</th>
              <th className="p-3 border">Receiver</th>
              <th className="p-3 border">Receiver Number</th>
              <th className="p-3 border">Amount</th>
              <th className="p-3 border">Transaction ID</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Account Type</th>
              <th className="p-3 border">Time</th>
              <th className="p-3 border">Actions</th>
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
                  <td className="p-3 border">{tx.id}</td>
                  <td className="p-3 border">{tx.customer_name || "Unknown"}</td>
                  <td className="p-3 border">{tx.receiver_name || "Unknown"}</td>
                  <td className="p-3 border">{tx.receiver_number || "N/A"}</td>
                  <td className="p-3 border">{tx.amount}</td>
                  <td className="p-3 border">{tx.tnx_id}</td>
                  <td className="px-6 py-4 border whitespace-nowrap text-center text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.status === "pending" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 border">{tx.account_type}</td>
                  <td className="p-3 border">{new Date(tx.tnx_time).toLocaleString()}</td>
                  <td className="p-3 border"><button>View</button></td>
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