import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
  const [selectedRows, setSelectedRows] = useState([]);
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const currentTransactions = filteredData.slice(
  indexOfFirstItem,
  indexOfLastItem
);

  // Day with suffix
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = date.getFullYear();

  // 12-hour time
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return `${day}${suffix} ${month} ${year}, ${time}`;
};
  const [form, setForm] = useState({
    receiver_id: "",
    receiver_input: "",
    account_type: "",
    customer_id: "",
    amount: "",
  });

  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  const [customers, setCustomers] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [amountError, setAmountError] = useState("");
  const [roundError, setRoundError] = useState("");
  const [kycRecord, setKycRecord] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [updatingTransaction, setUpdatingTransaction] = useState(false);
  const [paymentTransaction, setPaymentTransaction] = useState(null);
  const [paymentNote, setPaymentNote] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [startingGatewayPaymentId, setStartingGatewayPaymentId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const users_id = user.id || "User";
  const name = user.name || "User";
  const isAdmin = user.role === "admin";
  const currentCustomer = customers.find((customer) => customer.id === Number(users_id));
  const isCustomerBlocked = !isAdmin && currentCustomer?.status === "inactive";
  const isKycApproved = kycRecord?.status === "approved";
  const isKycBlocked = !isAdmin && !isKycApproved;
  const transactionBlockedMessage = isCustomerBlocked
    ? "user is block by admin please contact with admin"
    : "KYC must be submitted and approved by admin before making a transaction";

  const transactionRoundLimitation =
    settings.find(
      (item) =>
        item.setting_key === "transaction_round" ||
        item.setting_key === "transaction_round_limitation"
    )?.setting_value || "";
  const moneyLimitation =
    settings.find((item) => item.setting_key === "money_limitation")
      ?.setting_value || "";
  const totalMoneyLimitation =
    settings.find((item) => item.setting_key === "total_money_limitation")
      ?.setting_value || "";
  const now = new Date();
  const currentMonthTransactions = transactions.filter((tx) => {
    if (tx.customer_id !== Number(users_id)) {
      return false;
    }

    const txDate = new Date(tx.tnx_time);
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() === now.getMonth()
    );
  });
  const currentUserMonthlyTotalAmount = currentMonthTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );
  const currentUserTransactionCount = transactions.filter(
    (tx) => tx.customer_id === Number(users_id)
  ).length;
  const transactionRoundLimitValue = Number(transactionRoundLimitation);
  const hasReachedTransactionRoundLimit =
    Number.isFinite(transactionRoundLimitValue) &&
    transactionRoundLimitValue > 0 &&
    currentUserTransactionCount >= transactionRoundLimitValue;

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
    fetchKycRecord();
  }, []);
useEffect(() => {
  setCurrentPage(1);
}, [filters, transactions]);
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const gateway = searchParams.get("gateway");
    const paymentStatus = searchParams.get("paymentStatus");
    const message = searchParams.get("message");

    if (!gateway || !paymentStatus) {
      return;
    }

    alert(message || `${gateway} payment status: ${paymentStatus}`);
    fetchTransactions();
    navigate("/dashboard/transactions", { replace: true });
  }, [location.search, navigate]);

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

  const handleStatusUpdate = async (id, status, notes = "") => {
    try {
      setUpdatingTransaction(true);
      await axios.patch(`http://localhost:8081/auth/transaction/${id}`, {
        status,
        notes,
      });
      await fetchTransactions();
      setSelectedTransaction(null);
      setAdminNote("");
      alert(`Transaction marked as ${status}. Email notification attempted.`);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to update transaction status");
    } finally {
      setUpdatingTransaction(false);
    }
  };

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setAdminNote(transaction.notes || "");
  };

  const gatewayConfig = {
    bkash: {
      label: "bKash",
      badgeClass: "bg-pink-100 text-pink-700",
      buttonClass: "bg-pink-600 hover:bg-pink-700",
      panelClass: "border-pink-200 bg-pink-50",
    },
    nagad: {
      label: "Nagad",
      badgeClass: "bg-orange-100 text-orange-700",
      buttonClass: "bg-orange-600 hover:bg-orange-700",
      panelClass: "border-orange-200 bg-orange-50",
    },
    rocket: {
      label: "Rocket",
      badgeClass: "bg-purple-100 text-purple-700",
      buttonClass: "bg-purple-600 hover:bg-purple-700",
      panelClass: "border-purple-200 bg-purple-50",
    },
    sslcommerz: {
      label: "SSLCommerz",
      badgeClass: "bg-green-100 text-green-700",
      buttonClass: "bg-green-600 hover:bg-green-700",
      panelClass: "border-green-200 bg-green-50",
    },
  };

  const getGatewayConfig = (accountType) =>
    gatewayConfig[accountType] || {
      label: "Payment",
      badgeClass: "bg-slate-100 text-slate-700",
      buttonClass: "bg-slate-700 hover:bg-slate-800",
      panelClass: "border-slate-200 bg-slate-50",
    };

  const closeTransactionModal = () => {
    if (updatingTransaction) {
      return;
    }

    setSelectedTransaction(null);
    setAdminNote("");
  };

  const openPaymentModal = (transaction) => {
    setPaymentTransaction(transaction);
    setPaymentNote(transaction.notes || "");
  };

  const closePaymentModal = () => {
    if (processingPayment) {
      return;
    }

    setPaymentTransaction(null);
    setPaymentNote("");
  };

  const handlePaymentAction = async (status) => {
    if (!paymentTransaction) {
      return;
    }

    try {
      setProcessingPayment(true);
      await handleStatusUpdate(paymentTransaction.id, status, paymentNote);
      setPaymentTransaction(null);
      setPaymentNote("");
    } finally {
      setProcessingPayment(false);
    }
  };

  const startBkashPayment = async (transaction) => {
    try {
      setStartingGatewayPaymentId(transaction.id);
      const response = await axios.post(
        `http://localhost:8081/auth/bkash/payment/${transaction.id}/start`
      );

      if (!response.data?.bkashURL) {
        throw new Error("bKash URL was not returned by the server.");
      }

      window.location.assign(response.data.bkashURL);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.message || "Failed to start bKash payment");
    } finally {
      setStartingGatewayPaymentId(null);
    }
  };

  const startSSLCommerzPayment = async (transaction) => {
    try {
      setStartingGatewayPaymentId(transaction.id);
      const response = await axios.post(
        `http://localhost:8081/auth/sslcommerz/payment/${transaction.id}/start`
      );

      const paymentUrl =
        response.data?.paymentUrl ||
        response.data?.GatewayPageURL ||
        response.data?.gw_pageURL ||
        response.data?.redirect_url ||
        response.data?.payment_url ||
        response.data?.url;

      if (!paymentUrl) {
        throw new Error("SSLCommerz gateway URL was not returned by the server.");
      }

      window.location.assign(paymentUrl);
    } catch (error) {
      console.error("SSLCommerz Error:", error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Failed to open SSLCommerz payment gateway";
      
      const detailsMsg = error.response?.data?.details 
        ? `\n\nServer Response: ${JSON.stringify(error.response.data.details, null, 2)}`
        : "";
      
      alert(`${errorMsg}${detailsMsg}`);
    } finally {
      setStartingGatewayPaymentId(null);
    }
  };

  const handlePrintTransaction = () => {
    if (!selectedTransaction) {
      return;
    }

    const doc = new jsPDF();
    const details = [
      ["Customer", selectedTransaction.customer_name || "Unknown"],
      ["Receiver", selectedTransaction.receiver_name || "Unknown"],
      ["Receiver Number", selectedTransaction.receiver_number || "N/A"],
      ["Amount", String(selectedTransaction.amount ?? "N/A")],
      ["Transaction ID", selectedTransaction.tnx_id || "N/A"],
      ["Status", selectedTransaction.status || "N/A"],
      ["Account Type", selectedTransaction.account_type || "N/A"],
      ["Time", new Date(selectedTransaction.tnx_time).toLocaleString()],
      ["Note", selectedTransaction.notes || "N/A"],
    ];

    doc.setFontSize(18);
    doc.text("Transaction Details", 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [["Field", "Value"]],
      body: details,
      styles: {
        fontSize: 11,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [37, 99, 235],
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: "bold" },
        1: { cellWidth: 130 },
      },
    });

    const safeTransactionId = selectedTransaction.tnx_id || `transaction-${selectedTransaction.id}`;
    doc.save(`${safeTransactionId}.pdf`);
  };
const handleGenerateReport = async (tx) => {
  try {
    await axios.post("http://localhost:8081/auth/report", {
      transaction_id: tx.id,
    });

    alert("Report generated successfully");
  } catch (error) {
    console.error(error);
    alert("Failed to generate report");
  }
};
  const fetchKycRecord = async () => {
    if (!users_id || isAdmin) {
      return;
    }

    try {
      const res = await axios.get(`http://localhost:8081/auth/kyc/${users_id}`);
      setKycRecord(res.data || null);
    } catch (error) {
      console.error("Failed to fetch KYC record:", error);
      setKycRecord(null);
    }
  };

  const handleTransactionFormToggle = () => {
    if (isCustomerBlocked || isKycBlocked) {
      alert(transactionBlockedMessage);
      return;
    }

    setShowForm(!showForm);
  };
  const calculateFee = (amount) => {
  const feeType =
    settings.find((s) => s.setting_key === "transaction_fee_type")
      ?.setting_value || "percent";

  const feeValue =
    Number(
      settings.find((s) => s.setting_key === "transaction_fee_value")
        ?.setting_value
    ) || 0;

  let fee = 0;

  if (feeType === "percent") {
    fee = (amount * feeValue) / 100;
  } else if (feeType === "fixed") {
    fee = feeValue;
  }

  return fee;
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  setAmountError("");
  setRoundError("");

  if (isCustomerBlocked || isKycBlocked) {
    alert(transactionBlockedMessage);
    return;
  }

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
  const totalMoneyLimitValue = Number(totalMoneyLimitation);

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

  if (hasReachedTransactionRoundLimit) {
    setRoundError(
      `Transaction limit exceeded. You can transfer money only ${transactionRoundLimitation} times.`
    );
    return;
  }

  if (
    Number.isFinite(totalMoneyLimitValue) &&
    totalMoneyLimitValue > 0 &&
    currentUserMonthlyTotalAmount + enteredAmount > totalMoneyLimitValue
  ) {
    setAmountError(
      `Monthly total money limit exceeded. Maximum allowed total for this month is ${totalMoneyLimitation}.`
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

    const amount = Number(dataToSend.amount);

// calculate fee from settings
const fee = calculateFee(amount);
const totalAmount = amount + fee;

await axios.post("http://localhost:8081/auth/transaction", {
  customer_id: dataToSend.customer_id,
  account_type: dataToSend.account_type,
  amount: amount,
  fee: fee,
  total_amount: totalAmount,
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
      if (!filters.dateFrom && !filters.dateTo) return true;

      const txDate = new Date(tx.tnx_time).toISOString().split("T")[0];

      if (filters.dateFrom && txDate < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && txDate > filters.dateTo) {
        return false;
      }

      return true;
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
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const currentTransactions = filteredData.slice(
  indexOfFirstItem,
  indexOfLastItem
);
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

  const transactionTableColumnCount = 10;
  const getTransactionRowClassName = (tx) => {
    if (isAdmin && tx.status === "pending") {
      return "bg-amber-50";
    }

    return "";
  };

  const paymentGateway = paymentTransaction
    ? getGatewayConfig(paymentTransaction.account_type)
    : getGatewayConfig("");
const amountValue = Number(form.amount || 0);
const liveFee = calculateFee(amountValue);
const liveTotal = amountValue + liveFee;
  return (
    <div className="p-6">
    {!isAdmin && (
  <p className="text-sm text-gray-600 mt-1">
    Fee: {liveFee} | Total: {liveTotal}
  </p>
)}
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Transactions</h1>
        {!isAdmin?<button
          onClick={handleTransactionFormToggle}
          className={`px-4 py-2 rounded text-white ${
            isCustomerBlocked
              ? "bg-gray-400 cursor-not-allowed"
              : isKycBlocked
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {showForm ? "Close Form" : "Make Transaction"}
        </button>:null}
      </div>

      {isCustomerBlocked || isKycBlocked ? (
        <p className="mb-4 text-sm text-red-600">
          {transactionBlockedMessage}
        </p>
      ) : null}

      {/* <div className="mb-6 overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-600 text-left text-white">
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
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <p>
              Transaction round used: {currentUserTransactionCount}
              {transactionRoundLimitation ? ` / ${transactionRoundLimitation}` : ""}
            </p>
            <p>
              Per transaction limit: {moneyLimitation || "N/A"}
            </p>
            <p>
              This month total: {currentUserMonthlyTotalAmount}
              {totalMoneyLimitation ? ` / ${totalMoneyLimitation}` : ""}
            </p>
          </div>
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
              <button
                type="submit"
                disabled={
                  hasReachedTransactionRoundLimit ||
                  isCustomerBlocked ||
                  isKycBlocked
                }
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send Money Request
              </button>
            </div>
          </form>
          {roundError ? (
            <p className="mt-3 text-sm text-red-600">{roundError}</p>
          ) : null}
          {hasReachedTransactionRoundLimit ? (
            <p className="mt-3 text-sm text-red-600">
              You already reached the maximum transaction round limit for this user.
            </p>
          ) : null}
        </div>
      )}

      {/* Filters & Download */}
      <div className="flex gap-4 mb-4 ">
        <select className="border border-gray-400 px-3 py-2 rounded" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="send">Success</option>
          <option value="failed">Failed</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">From</span>
          <input
            type="date"
            className="border border-gray-400 px-3 py-2 rounded"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
          />
          <span className="text-sm text-gray-600">to</span>
          <input
            type="date"
            className="border border-gray-400 px-3 py-2 rounded"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
          />
        </div>
        <input type="text" className="border border-gray-400 px-3 py-2 rounded" placeholder="Search name or number" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />

        <button className="border border-gray-400 px-3 py-2 rounded flex items-center gap-2" onClick={downloadPDF}>
          Download Data Table <Download size={16} />
        </button>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border bg-white">
          <thead className="bg-gray-200 text-black">
            <tr className="text-nowrap">
              <th className="p-3 border">
                <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} className="accent-white" />
              </th>
               <th className="p-3 border font-semibold">no.</th>
              {/* <th className="p-3 border">আইডি</th> */}
              <th className="p-3 border font-semibold">কাস্টমার</th>
              <th className="p-3 border font-semibold">গ্রহীতা</th>
              <th className="p-3 border font-semibold ">গ্রহীতার নম্বর</th>
              <th className="p-3 border font-semibold">পরিমাণ</th>
              <th className="p-3 border font-semibold">ট্রানজেকশন আইডি</th>
              <th className="p-3 border font-semibold">স্টেটাস</th>
              <th className="p-3 border font-semibold">অ্যাকাউন্ট ধরন</th>
              <th className="p-3 border font-semibold">সময়</th>
              <th className="p-3 border font-semibold sticky right-0 bg-gray-200 z-10">অ্যাকশন</th>
              
            </tr>
          </thead>
          <tbody className="border border-black">
            {loading ? (
              <tr>
                <td colSpan={transactionTableColumnCount} className="p-6 text-center text-gray-500">Loading transactions...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={transactionTableColumnCount} className="p-6 text-center text-gray-500">No data inserted</td>
              </tr>
            ) : (
              currentTransactions.map((tx, index) => (
                <tr key={tx.id} className={`text-center ${getTransactionRowClassName(tx)}`}>
                  <td className="p-3 border">
                    <input type="checkbox" checked={selectedRows.includes(tx.id)} onChange={() => handleRowSelect(tx.id)} />
                  </td>
                  <td className="p-3 border text-nowrap">
 {indexOfFirstItem + index + 1}
</td>
                  {/* <td className="p-3 border">{tx.id}</td> */}
                  <td className="p-3 border text-nowrap">{tx.customer_name || "Unknown"}</td>
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
                <td className="p-3 border text-nowrap ">
  {formatDateTime(tx.tnx_time)}
</td>
                  <td className="p-3 border sticky right-0 bg-white z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex  items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openTransactionModal(tx)}
                        className="rounded  px-1 py-1 text-black border border-black "
                      >
                        <Eye size={18} />
                      </button>
                      {isAdmin && tx.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() =>
                            tx.account_type === "bkash"
                              ? startBkashPayment(tx)
                              : openPaymentModal(tx)
                          }
                          disabled={startingGatewayPaymentId === tx.id}
                          className="rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {startingGatewayPaymentId === tx.id
                            ? "Starting..."
                            : "Send"}
                        </button>
                      ) : null}
                    </div>
                    <button
  onClick={() => handleGenerateReport(tx)}
  className="rounded px-2 py-1 text-white bg-blue-600 hover:bg-blue-700"
>
  Report
</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex justify-center items-center gap-2 mt-4">
  <button
    className="px-3 py-1 border rounded disabled:opacity-50"
    disabled={currentPage === 1}
    onClick={() => setCurrentPage((prev) => prev - 1)}
  >
    Prev
  </button>

  {Array.from({
    length: Math.ceil(filteredData.length / itemsPerPage),
  }).map((_, i) => (
    <button
      key={i}
      onClick={() => setCurrentPage(i + 1)}
      className={`px-3 py-1 border rounded ${
        currentPage === i + 1 ? "bg-blue-600 text-white" : ""
      }`}
    >
      {i + 1}
    </button>
  ))}

  <button
    className="px-3 py-1 border rounded disabled:opacity-50"
    disabled={
      currentPage === Math.ceil(filteredData.length / itemsPerPage)
    }
    onClick={() => setCurrentPage((prev) => prev + 1)}
  >
    Next
  </button>
</div>
      </div>

      {selectedTransaction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Transaction Details
                </h2>
                <p className="text-sm text-gray-500">
                  {isAdmin
                    ? "Review transaction information and add note before updating status."
                    : "Read-only transaction details for your record."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTransactionModal}
                disabled={updatingTransaction}
                className="rounded border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2">
              <p><span className="font-semibold">Customer:</span> {selectedTransaction.customer_name || "Unknown"}</p>
              <p><span className="font-semibold">Sender Number:</span> {selectedTransaction.customer_phone || "N/A"}</p>
              <p><span className="font-semibold">Receiver:</span> {selectedTransaction.receiver_name || "Unknown"}</p>
              <p><span className="font-semibold">Receiver Number:</span> {selectedTransaction.receiver_number || "N/A"}</p>
              <p><span className="font-semibold">Amount:</span> {selectedTransaction.amount}</p>
              <p><span className="font-semibold">Transaction ID:</span> {selectedTransaction.tnx_id || "N/A"}</p>
              <p><span className="font-semibold">Status:</span> {selectedTransaction.status}</p>
              <p><span className="font-semibold">Account Type:</span> {selectedTransaction.account_type}</p>
              <p><span className="font-semibold">Time:</span> {new Date(selectedTransaction.tnx_time).toLocaleString()}</p>
            </div>

            {isAdmin ? (
              <>
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Note
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={4}
                    className="w-full rounded border px-3 py-2"
                    placeholder="Write note here"
                    disabled={updatingTransaction}
                  />
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  {selectedTransaction.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(selectedTransaction.id, "failed", adminNote)
                        }
                        disabled={updatingTransaction}
                        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingTransaction ? "Saving..." : "Reject"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusUpdate(selectedTransaction.id, "send", adminNote)
                        }
                        disabled={updatingTransaction}
                        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingTransaction ? "Saving..." : "Send"}
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">
                      This transaction has already been updated.
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mt-5 rounded border bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">Note</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedTransaction.notes || "N/A"}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handlePrintTransaction}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Print
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {paymentTransaction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {paymentGateway.label} Payment Gateway
                  </h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentGateway.badgeClass}`}>
                    {paymentTransaction.account_type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Send money from sender number to receiver number using the selected gateway.
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={processingPayment || updatingTransaction}
                className="rounded border px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className={`mb-5 rounded-xl border p-4 ${paymentGateway.panelClass}`}>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-800 md:grid-cols-2">
                <p><span className="font-semibold">Sender:</span> {paymentTransaction.customer_name || "Unknown"}</p>
                <p><span className="font-semibold">Sender Number:</span> {paymentTransaction.customer_phone || "N/A"}</p>
                <p><span className="font-semibold">Receiver:</span> {paymentTransaction.receiver_name || "Unknown"}</p>
                <p><span className="font-semibold">Receiver Number:</span> {paymentTransaction.receiver_number || "N/A"}</p>
                <p><span className="font-semibold">Amount:</span> {paymentTransaction.amount}</p>
                <p><span className="font-semibold">Gateway:</span> {paymentGateway.label}</p>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-dashed border-gray-300 p-4">
              <p className="text-sm font-medium text-gray-700">Payment method</p>
              <p className="mt-1 text-sm text-gray-600">
                {paymentTransaction.account_type === "bkash"
                  ? "bKash gateway selected. Use the sender bKash number to transfer to the receiver bKash wallet."
                  : paymentTransaction.account_type === "nagad"
                  ? "Nagad gateway selected. Use the sender Nagad number to transfer to the receiver Nagad wallet."
                  : paymentTransaction.account_type === "rocket"
                  ? "Rocket gateway selected. Use the sender Rocket number to transfer to the receiver Rocket wallet."
                  : "Use the available payment method for this transaction."}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Admin Note
              </label>
              <textarea
                rows={4}
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="Add payment reference, gateway note, or admin comment"
                disabled={processingPayment || updatingTransaction}
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => handlePaymentAction("failed")}
                disabled={processingPayment || updatingTransaction}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingPayment || updatingTransaction ? "Processing..." : "Mark Failed"}
              </button>
              <button
                type="button"
                onClick={() => handlePaymentAction("send")}
                disabled={processingPayment || updatingTransaction}
                className={`rounded px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60 ${paymentGateway.buttonClass}`}
              >
                {processingPayment || updatingTransaction
                  ? `Processing ${paymentGateway.label}...`
                  : `Pay with ${paymentGateway.label}`}
              </button>
              <button
                type="button"
                onClick={() => startSSLCommerzPayment(paymentTransaction)}
                disabled={processingPayment || updatingTransaction || startingGatewayPaymentId === paymentTransaction?.id}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {startingGatewayPaymentId === paymentTransaction?.id
                  ? "Opening..."
                  : "Open SSLCommerz Gateway"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Transaction;
