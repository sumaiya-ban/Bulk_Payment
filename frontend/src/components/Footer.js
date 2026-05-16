import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck } from "lucide-react";
import { BASE_URL } from "../constants";

const defaultData = {
  brand_text: "BulkPay",
  description: "The modern platform for bulk payments. Fast, secure, global.",
  product_title: "Product",
  product_link1_label: "Services",
  product_link1_href: "#services",
  product_link2_label: "Transactions",
  product_link2_href: "#transaction",
  product_link3_label: "Pricing",
  product_link3_href: "#",
  product_link4_label: "API Docs",
  product_link4_href: "#",
  company_title: "Company",
  company_link1_label: "About",
  company_link1_href: "#",
  company_link2_label: "Partners",
  company_link2_href: "#partners",
  company_link3_label: "Careers",
  company_link3_href: "#",
  company_link4_label: "Contact",
  company_link4_href: "#contact",
  legal_title: "Legal",
  legal_link1_label: "Privacy Policy",
  legal_link1_href: "#",
  legal_link2_label: "Terms of Service",
  legal_link2_href: "#",
  legal_link3_label: "Compliance",
  legal_link3_href: "#",
  copyright_text: "Copyright 2026 BulkPay. All rights reserved.",
};

const getLinks = (data, prefix, count) =>
  Array.from({ length: count }, (_, index) => {
    const num = index + 1;
    return {
      label: data[`${prefix}_link${num}_label`],
      href: data[`${prefix}_link${num}_href`] || "#",
    };
  }).filter((link) => link.label);

const FooterLinks = ({ title, links }) => (
  <div>
    <h4 className="font-semibold text-sm mb-4 text-white">{title}</h4>
    <ul className="space-y-2 text-sm text-white/55">
      {links.map((link) => (
        <li key={`${title}-${link.label}`}>
          <a href={link.href} className="hover:text-green-300 transition">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/footer-section`);
        setData(res.data || defaultData);
      } catch (err) {
        console.log("Footer section fetch error:", err);
        setData(defaultData);
      }
    };

    fetchSection();
  }, []);

  return (
    <footer className="bg-[#04100c] text-white/70 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <a
              href="#home"
              className="flex items-center gap-3 text-lg font-bold text-white mb-4"
            >
              <span className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </span>
              {data.brand_text}
            </a>
            <p className="text-sm text-white/55 leading-relaxed max-w-sm">
              {data.description}
            </p>
          </div>

          <FooterLinks
            title={data.product_title}
            links={getLinks(data, "product", 4)}
          />
          <FooterLinks
            title={data.company_title}
            links={getLinks(data, "company", 4)}
          />
          <FooterLinks
            title={data.legal_title}
            links={getLinks(data, "legal", 3)}
          />
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/45">{data.copyright_text}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
