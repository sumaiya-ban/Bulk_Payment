import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../constants";

const defaultData = {
  badge_text: "Transactions",
  title: "Seamless Transaction Processing",
  description:
    "From a single payment to millions, our platform handles it all. Upload your payment file, review, approve, and watch it happen.",
  card_title: "Recent Transactions",
  card_badge_text: "Live",
  feature1: "CSV and API batch upload support",
  feature2: "Instant settlement to 150+ countries",
  feature3: "Real-time transaction tracking",
  feature4: "Automatic reconciliation reports",
  feature5: "Multi-level approval workflows",
  feature6: "Webhook notifications for every event",
  tx1_name: "Payroll - March",
  tx1_amount: "$124,500",
  tx1_status: "Completed",
  tx1_count: "320 recipients",
  tx2_name: "Vendor Payments",
  tx2_amount: "$45,230",
  tx2_status: "Processing",
  tx2_count: "48 recipients",
  tx3_name: "Refunds Batch",
  tx3_amount: "$8,920",
  tx3_status: "Completed",
  tx3_count: "156 recipients",
  tx4_name: "Contractor Payout",
  tx4_amount: "$67,100",
  tx4_status: "Scheduled",
  tx4_count: "89 recipients",
};

const getFeatures = (data) =>
  [1, 2, 3, 4, 5, 6].map((num) => data[`feature${num}`]).filter(Boolean);

const getTransactions = (data) =>
  [1, 2, 3, 4]
    .map((num) => ({
      name: data[`tx${num}_name`],
      amount: data[`tx${num}_amount`],
      status: data[`tx${num}_status`],
      count: data[`tx${num}_count`],
    }))
    .filter((tx) => tx.name);

const TransactionSection = () => {
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/transaction-section`);
        setData(res.data || defaultData);
      } catch (err) {
        console.log("Transaction section fetch error:", err);
        setData(defaultData);
      }
    };

    fetchSection();
  }, []);

  const features = getFeatures(data);
  const transactions = getTransactions(data);

  return (
    <section id="transaction" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              {data.badge_text}
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {data.title}
            </h2>

            <p className="text-gray-600 mb-8 leading-relaxed">
              {data.description}
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

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">
                {data.card_title}
              </h3>
              <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-3 py-1 rounded-full">
                {data.card_badge_text}
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
