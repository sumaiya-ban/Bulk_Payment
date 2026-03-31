import { useState } from "react";
import { Link } from "react-router-dom";
const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Service", href: "#services" },
  { label: "Transaction", href: "#transaction" },
  { label: "Partner", href: "#partners" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
       
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 text-xl font-bold text-blue-600">
           BulkPay
        </a>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Button */}
        <div className="flex gap-4">
           <a
          href="#contact"
          className="hidden md:inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Get Started
        </a>
        <Link
          to="/login"
          className="hidden md:inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
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
      {open && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 pb-6">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            
           <li> <Link
          to="/login"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Login
        </Link></li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;