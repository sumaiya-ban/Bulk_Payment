import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Clock,
  CreditCard,
  Globe,
  Shield,
  Users,
} from "lucide-react";
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
  CARD: CreditCard,
  USERS: Users,
  CHART: BarChart3,
  CLOCK: Clock,
  SHIELD: Shield,
  GLOBE: Globe,
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
      Icon: iconMap[data[`service${num}_icon`]] || CreditCard,
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
    <section
      id="services"
      className="relative overflow-hidden py-24 bg-[#06110d]"
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,17,13,0.88), rgba(6,17,13,0.94)),
            url('/sendora_emotional.png')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_32%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-green-300 backdrop-blur-sm mb-5">
            {data.badge_text}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {data.title}
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto leading-relaxed">
            {data.description}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-2xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.14]"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-400/25 flex items-center justify-center mb-5 text-green-300 group-hover:bg-green-500 group-hover:text-white transition">
                {service.iconImage ? (
                  <img
                    src={service.iconImage}
                    alt=""
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <service.Icon className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {service.title}
              </h3>
              <p className="text-sm text-white/65 leading-relaxed">
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
