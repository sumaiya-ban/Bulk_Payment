import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8081";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Service", href: "#services" },
  { label: "Transaction", href: "#transaction" },
  { label: "Partner", href: "#partners" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [hero, setHero] = useState(null);
const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/hero`);
        setHero(res.data);
      } catch (err) {
        console.log("Failed to fetch hero data:", err);
      }
    };
    fetchHero();
  }, []);

  // Smooth scroll function
  const handleScroll = (e, href) => {
    e.preventDefault();

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setOpen(false); // Close mobile menu after click
  };
useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
  return (
    <nav
  className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b backdrop-blur-lg
  ${
    scrolled
      ? "bg-white/80 border-gray-200 shadow-sm"
      : "bg-white backdrop-blur-lg border-gray-200 shadow-sm"
  }`}
>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <a
          href="#home"
          onClick={(e) => handleScroll(e, "#home")}
          className="flex items-center gap-2 text-xl font-bold text-primary"
        >
          {hero?.logo ? (
  <img
    src={
      hero.logo.startsWith("http")
        ? hero.logo
        : `${BASE_URL}${hero.logo}`
    }
    alt="Logo"
    className="h-8 object-contain"
  />
) : (
  "SENDORA"
)}
        </a>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Buttons */}
        <div className="flex gap-4">
          {/* <a
            href="#contact"
            onClick={(e) => handleScroll(e, "#contact")}
            className="hidden md:inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started
          </a> */}

          <Link
            to="/login"
            className="hidden md:inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Login
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden text-gray-700 text-2xl"
          onClick={() => setOpen(!open)}
        >
          {open ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border-b border-gray-200 px-6 pb-6">
          <ul className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={(e) => handleScroll(e, link.href)}
                  className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}

            <li>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;