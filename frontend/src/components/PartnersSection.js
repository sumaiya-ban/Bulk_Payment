import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../constants";

const defaultData = {
  title: "Trusted by Industry Leaders",
  partner1_name: "Bkash",
  partner1_logo: "",
  partner2_name: "Nagad",
  partner2_logo: "",
  partner3_name: "Rocket",
  partner3_logo: "/dutch-bangla-rocket-logo.png",
  partner4_name: "",
  partner4_logo: "",
  partner5_name: "",
  partner5_logo: "",
  partner6_name: "",
  partner6_logo: "",
};

const getPartners = (data) =>
  [1, 2, 3, 4, 5, 6]
    .map((num) => ({
      name: data[`partner${num}_name`],
      logo: data[`partner${num}_logo`],
    }))
    .filter((partner) => partner.name);

const PartnersSection = () => {
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/partners-section`);
        setData(res.data || defaultData);
      } catch (err) {
        console.log("Partners section fetch error:", err);
        setData(defaultData);
      }
    };

    fetchSection();
  }, []);

  const partners = getPartners(data);

  return (
    <section id="partners" className="py-20 bg-[#eef8f2]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="inline-flex items-center rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm mb-5">
          Partners
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-950 mb-12">
          {data.title}
        </h2>

        <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {partners.map((partner) => (
          <div
  key={partner.name}
  className="group bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-2 border-green-500 rounded-2xl p-8 flex flex-col items-center justify-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
>
  <img
    src={partner.logo}
    alt={partner.name}
    className="h-14 max-w-36 object-contain mb-4 transition duration-300"
  />

  <span className="text-lg font-semibold text-gray-600 group-hover:text-green-700">
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
