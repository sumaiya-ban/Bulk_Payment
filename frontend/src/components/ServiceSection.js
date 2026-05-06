import React from "react";

const services = [
  {
    icon: "💳",
    title: "Mass Payouts",
    description:
      "Send payments to thousands of recipients simultaneously with just one upload.",
  },
  {
    icon: "👥",
    title: "Payroll Processing",
    description:
      "Automate salary disbursements for your entire workforce effortlessly.",
  },
  {
    icon: "📊",
    title: "Real-Time Analytics",
    description:
      "Track every transaction with detailed dashboards and instant reporting.",
  },
  {
    icon: "⏰",
    title: "Scheduled Payments",
    description:
      "Set up recurring payments and schedule future transactions with ease.",
  },
  {
    icon: "🛡️",
    title: "Fraud Protection",
    description:
      "Advanced AI-powered fraud detection keeps every transaction secure.",
  },
  {
    icon: "💱",
    title: "Multi-Currency",
    description:
      "Pay anyone, anywhere in the world with automatic currency conversion.",
  },
];

const ServiceSection = () => {
  return (
    <section id="services" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">
            Our Services
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Bulk Payments
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A complete suite of tools to manage, automate, and scale your payment operations.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-2xl p-8 border border-gray-200 shadow hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-5 text-xl">
                {service.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;