import React from 'react';
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

const stats = [
  {
    title: "Total Balance",
    value: "$48,250.00",
    change: "+12.5%",
    icon: DollarSign,
  },
  {
    title: "Total Sent",
    value: "$32,100.00",
    change: "+8.2%",
    icon: ArrowUpRight,
  },
  {
    title: "Total Received",
    value: "$16,150.00",
    change: "+4.1%",
    icon: ArrowDownLeft,
  },
  {
    title: "Recipients",
    value: "1,240",
    change: "+24",
    icon: Users,
  },
];

const recentTransactions = [
  { name: "Sarah Johnson", amount: "-$2,500.00", type: "sent", date: "2 min ago", status: "Completed" },
  { name: "Tech Corp Ltd", amount: "+$8,200.00", type: "received", date: "1 hour ago", status: "Completed" },
  { name: "Mike Williams", amount: "-$450.00", type: "sent", date: "3 hours ago", status: "Processing" },
];

const quickRecipients = [
  { name: "Sarah J.", initials: "SJ", color: "bg-blue-500" },
  { name: "Mike W.", initials: "MW", color: "bg-green-500" },
  { name: "Tech Co.", initials: "TC", color: "bg-red-500" },
  { name: "Anna K.", initials: "AK", color: "bg-purple-500" },
];

const DashboardOverview = () => {
    return (
        <div className="p-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between mb-3">
                  <div className="p-2 bg-gray-100 rounded">
                    <stat.icon className="w-5 h-5 text-blue-600" />
                  </div>

                  <span className="flex items-center text-green-500 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </span>
                </div>

                <h2 className="text-2xl font-bold">{stat.value}</h2>
                <p className="text-xs text-gray-500">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* Transactions */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">

              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="font-semibold">Recent Transactions</h2>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </div>

              <div>
                {recentTransactions.map((tx, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">

                      <div
                        className={`p-2 rounded-full ${
                          tx.type === "sent"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
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
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Section */}
            <div className="space-y-6">

              {/* Quick Send */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold mb-4">Quick Send</h2>

                <div className="flex gap-3 mb-4">

                  {quickRecipients.map((r, i) => (
                    <div key={i} className="text-center">
                      <div
                        className={`w-10 h-10 ${r.color} text-white rounded-full flex items-center justify-center`}
                      >
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

                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded">
                  <Send className="w-4 h-4" />
                  Send Money
                </button>
              </div>

              {/* Budget */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold mb-4">Monthly Budget</h2>

                <div className="space-y-4">

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Payroll</span>
                      <span>$18,400 / $25,000</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded h-2">
                      <div className="bg-blue-600 h-2 rounded w-[73%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Vendors</span>
                      <span>$8,200 / $15,000</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded h-2">
                      <div className="bg-blue-600 h-2 rounded w-[55%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Operations</span>
                      <span>$3,500 / $10,000</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded h-2">
                      <div className="bg-blue-600 h-2 rounded w-[35%]"></div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
    );
};

export default DashboardOverview;
