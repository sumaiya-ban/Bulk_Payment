import React from "react";

const features = [
  "CSV & API batch upload support",
  "Instant settlement to 150+ countries",
  "Real-time transaction tracking",
  "Automatic reconciliation reports",
  "Multi-level approval workflows",
  "Webhook notifications for every event",
];

const transactions = [
  { name: "Payroll — March", amount: "$124,500", status: "Completed", count: "320 recipients" },
  { name: "Vendor Payments", amount: "$45,230", status: "Processing", count: "48 recipients" },
  { name: "Refunds Batch", amount: "$8,920", status: "Completed", count: "156 recipients" },
  { name: "Contractor Payout", amount: "$67,100", status: "Scheduled", count: "89 recipients" },
];

const TransactionSection = () => {
  return (
    <section id="transaction" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side */}
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              Transactions
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Seamless Transaction Processing
            </h2>

            <p className="text-gray-600 mb-8 leading-relaxed">
              From a single payment to millions, our platform handles it all.
              Upload your payment file, review, approve, and watch the magic happen.
            </p>

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-sm text-gray-800">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">
                Recent Transactions
              </h3>
              <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-3 py-1 rounded-full">
                Live
              </span>
            </div>

            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.name}
                  className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.name}
                    </p>
                    <p className="text-xs text-gray-500">{tx.count}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {tx.amount}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        tx.status === "Completed"
                          ? "text-green-600"
                          : tx.status === "Processing"
                          ? "text-yellow-600"
                          : "text-red-500"
                      }`}
                    >
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TransactionSection;