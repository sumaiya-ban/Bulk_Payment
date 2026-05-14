import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../constants";

const defaultData = {
  badge_text: "Our Services",
  title: "Everything You Need for Bulk Payments",
  description:
    "A complete suite of tools to manage, automate, and scale your payment operations.",
  service1_icon: "CARD",
  service1_title: "Mass Payouts",
  service1_description:
    "Send payments to thousands of recipients simultaneously with just one upload.",
  service2_icon: "USERS",
  service2_title: "Payroll Processing",
  service2_description:
    "Automate salary disbursements for your entire workforce effortlessly.",
  service3_icon: "CHART",
  service3_title: "Real-Time Analytics",
  service3_description:
    "Track every transaction with detailed dashboards and instant reporting.",
  service4_icon: "CLOCK",
  service4_title: "Scheduled Payments",
  service4_description:
    "Set up recurring payments and schedule future transactions with ease.",
  service5_icon: "SHIELD",
  service5_title: "Fraud Protection",
  service5_description: "Advanced fraud detection keeps every transaction secure.",
  service6_icon: "GLOBE",
  service6_title: "Multi-Currency",
  service6_description:
    "Pay anyone, anywhere in the world with automatic currency conversion.",
};

const iconMap = {
  CARD: "💳",
  USERS: "👥",
  CHART: "📊",
  CLOCK: "⏰",
  SHIELD: "🛡️",
  GLOBE: "🌐",
};

const getImageSrc = (value) => {
  if (!value) return "";
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:image")) {
    return value;
  }
  if (value.startsWith("/uploads/")) {
    return `${BASE_URL}${value}`;
  }
  return "";
};

const getServices = (data) =>
  [1, 2, 3, 4, 5, 6]
    .map((num) => ({
      icon: iconMap[data[`service${num}_icon`]] || data[`service${num}_icon`],
      iconImage: getImageSrc(data[`service${num}_icon`]),
      title: data[`service${num}_title`],
      description: data[`service${num}_description`],
    }))
    .filter((service) => service.title);

const ServiceSection = () => {
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/services-section`);
        setData(res.data || defaultData);
      } catch (err) {
        console.log("Services section fetch error:", err);
        setData(defaultData);
      }
    };

    fetchSection();
  }, []);

  const services = getServices(data);

  return (
    <section id="services" className="py-24 bg-[aliceblue]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">
            {data.badge_text}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {data.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {data.description}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-2xl p-8 border border-gray-300 shadow hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-5">
  {service.iconImage ? (
    <img
      src={service.iconImage}
      alt=""
      className="w-12 h-12 object-contain"
    />
  ) : (
    <span className="text-4xl">{service.icon}</span>
  )}
</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;
