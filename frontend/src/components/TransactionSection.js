import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Radio, ShieldCheck, WalletCards } from "lucide-react";
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
    <section id="transaction" className="py-24  bg-[#eef8f2]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-500 mb-5">
              <ShieldCheck className="w-4 h-4" />
              {data.badge_text}
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 mb-6">
              {data.title}
            </h2>

            <p className="text-gray-600 mb-8 leading-relaxed">
              {data.description}
            </p>

            <ul className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
                >
                  <span className="mt-0.5 w-5 h-5 flex shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-green-500/15 border border-green-400/25 flex items-center justify-center text-green-500">
                  <WalletCards className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-950">{data.card_title}</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-medium bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                <Radio className="w-3 h-3" />
                {data.card_badge_text}
              </span>
            </div>

            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.name}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-950">{tx.name}</p>
                    <p className="text-xs text-gray-500">{tx.count}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-950">
                      {tx.amount}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        tx.status === "Completed"
                          ? "text-green-500"
                          : tx.status === "Processing"
                          ? "text-yellow-500"
                          : "text-emerald-500"
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
