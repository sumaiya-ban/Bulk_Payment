import React from "react";

const partners = [
  {
    name: "Bkash",
    logo: "https://download.logo.wine/logo/BKash/BKash-Logo.wine.png",
  },
  {
    name: "Nagad",
    logo: "https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png",
  },
  {
    name: "Rocket",
    logo: "https://download.logo.wine/logo/Dutch-Bangla_Bank_Rocket/Dutch-Bangla_Bank_Rocket-Logo.wine.png",
  },
];

const PartnersSection = () => {
  return (
    <section id="partners" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 text-center">

        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          Trusted by Industry Leaders
        </h2>

        {/* Dynamic Grid */}
        <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="group bg-white border border-gray-300 rounded-3xl p-8 flex flex-col items-center justify-center shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              {/* Logo */}
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-14 object-contain mb-4 grayscale group-hover:grayscale-0 transition duration-300"
              />

              {/* Name */}
              <span className="text-sm font-semibold text-gray-600 group-hover:text-indigo-600">
                {partner.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PartnersSection;