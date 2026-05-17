import React from 'react';
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Send,
  Plus,
  MoreHorizontal,
} from "lucide-react";

const quickRecipients = [
  { name: "Sarah J.", initials: "SJ", color: "bg-blue-500" },
  { name: "Mike W.", initials: "MW", color: "bg-green-500" },
  { name: "Tech Co.", initials: "TC", color: "bg-red-500" },
  { name: "Anna K.", initials: "AK", color: "bg-purple-500" },
];

const DashboardOverview = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "admin";
  const isAdmin = role === "admin";
  const isCustomer = role === "customer";

  const [totalBalance, setTotalBalance] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          const [balanceRes, userRes, monthlyRes, yearlyRes, dailyRes] = await Promise.all([
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transactions/total`),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/active-count`),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transactions/monthly`),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transactions/yearly`),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transactions/daily`),
          ]);

          setTotalBalance(balanceRes.data.totalBalance || 0);
          setTotalUsers(userRes.data.totalUsers || 0);
          setMonthlyTotal(monthlyRes.data.total || 0);
          setYearlyTotal(yearlyRes.data.total || 0);
          setDailyData(dailyRes.data || []);
        } else if (isCustomer) {
          const [balanceRes, monthlyRes, yearlyRes, recentRes] = await Promise.all([
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transactions/total?customer_id=${user.id}`),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transactions/monthly?customer_id=${user.id}`),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/transactions/yearly?customer_id=${user.id}`),
            axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/transactions/${user.id}?status=send`),
          ]);

          setTotalBalance(balanceRes.data.totalBalance || 0);
          setMonthlyTotal(monthlyRes.data.total || 0);
          setYearlyTotal(yearlyRes.data.total || 0);
          setRecentTransactions(
            (recentRes.data || []).map((tx) => ({
              name: tx.receiver_name || tx.customer_name || "Transaction",
              amount: `-$${Number(tx.amount).toFixed(2)}`,
              type: "sent",
              date: tx.tnx_time
                ? new Date(tx.tnx_time).toLocaleString()
                : tx.created_at
                ? new Date(tx.created_at).toLocaleString()
                : "-",
              status: tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : "Send",
            }))
          );
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [isAdmin, isCustomer, user.id]);

  const stats = isAdmin
    ? [
        {
          title: "Total Transactions",
          value: `$${totalBalance}`,
          change: "+12.5%",
          icon: DollarSign,
        },
        {
          title: "This Month Transactions",
          value: `$${Number(monthlyTotal).toLocaleString()}`,
          change: "+8.2%",
          icon: ArrowUpRight,
        },
        {
          title: "This Year Transactions",
          value: `$${Number(yearlyTotal).toLocaleString()}`,
          change: "+4.1%",
          icon: ArrowDownLeft,
        },
        {
          title: "Total Active Users",
          value: totalUsers,
          change: "+24",
          icon: Users,
        },
      ]
    : [
        {
          title: "Total Transactions",
          value: `$${totalBalance}`,
          change: "+12.5%",
          icon: DollarSign,
        },
        {
          title: "This Month Transactions",
          value: `$${Number(monthlyTotal).toLocaleString()}`,
          change: "+8.2%",
          icon: ArrowUpRight,
        },
        {
          title: "This Year Transactions",
          value: `$${Number(yearlyTotal).toLocaleString()}`,
          change: "+4.1%",
          icon: ArrowDownLeft,
        },
      ];

  const cardStyles = [
    {
      wrapper: "bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-white border-transparent",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      changeColor: "text-white",
    },
    {
      wrapper: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white border-transparent",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      changeColor: "text-white",
    },
    {
      wrapper: "bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 text-white border-transparent",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      changeColor: "text-white",
    },
    {
      wrapper: "bg-gradient-to-br from-yellow-400 via-orange-300 to-amber-200 text-slate-900 border-transparent",
      iconBg: "bg-white/25",
      iconColor: "text-slate-900",
      changeColor: "text-slate-900",
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Stats */}
      {(isAdmin || isCustomer) && (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
  {stats.map((stat, i) => (
    <div
      key={i}
      className={`relative overflow-hidden rounded-xl p-4 border ${cardStyles[i].wrapper} transform transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_40px_rgba(15,23,42,0.12)]`}
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />

      <div className="relative flex justify-between mb-2">
        <div className={`p-2 rounded-xl ${cardStyles[i].iconBg} shadow-sm`}>
          <stat.icon className={`w-5 h-5 ${cardStyles[i].iconColor}`} />
        </div>

        <span className={`flex items-center ${cardStyles[i].changeColor} text-[10px] font-semibold`}>
          <TrendingUp className="w-3 h-3 mr-1" />
          {stat.change}
        </span>
      </div>

      <div className="relative">
        <h2 className="text-xl font-bold">{stat.value}</h2>
        <p className="text-[11px] font-semibold opacity-90">{stat.title}</p>
      </div>
    </div>
  ))}
</div>
      )}

      {isAdmin ? (
        <div className="bg-sky-50 rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <h2 className="font-bold text-lg mb-1 text-slate-900">Daily Transaction Amounts</h2>
          <p className="text-sm text-slate-600 mb-4">Total transaction volume by day</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", color: "#0f172a" }}
                cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Transactions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">Recent Transactions</h2>
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>

            <div>
              {isCustomer && recentTransactions.length === 0 ? (
                <div className="p-4 text-gray-500">No sent transactions found for your account.</div>
              ) : (
                recentTransactions.map((tx, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 border-b last:border-none">
                    <div className="flex items-center gap-3">

                      <div className={`p-2 rounded-full ${
                        tx.type === "sent"
                          ? "bg-red-100 text-red-500"
                          : "bg-green-100 text-green-500"
                      }`}>
                        {tx.type === "sent" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium">{tx.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tx.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">{tx.amount}</p>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            {isCustomer && (
              <>
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <h2 className="font-semibold mb-4">Quick Send</h2>

                  <div className="flex gap-3 mb-4">
                    {quickRecipients.map((r, i) => (
                      <div key={i} className="text-center">
                        <div className={`w-10 h-10 ${r.color} text-white rounded-full flex items-center justify-center`}>
                          {r.initials}
                        </div>
                        <p className="text-xs text-gray-500">{r.name}</p>
                      </div>
                    ))}

                    <div className="text-center">
                      <div className="w-10 h-10 border border-dashed flex items-center justify-center rounded-full">
                        <Plus className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-500">Add</p>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-lg">
                    <Send className="w-4 h-4" />
                    Send Money
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardOverview;