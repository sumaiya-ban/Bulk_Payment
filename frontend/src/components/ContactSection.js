import React, { useState } from "react";

const ContactSection = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = {
    name: e.target[0].value,
    email: e.target[1].value,
    message: e.target[2].value,
  };

  try {
   const res = await fetch("http://localhost:8081/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      setSubmitted(true);
      e.target.reset();
      setTimeout(() => setSubmitted(false), 3000);
    }
  } catch (err) {
    console.error(err);
  }
};
  return (
    <section id="contact" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Left Side */}
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              Contact Us
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Let's Talk Payments
            </h2>

            <p className="text-gray-600 mb-10 leading-relaxed">
              Have questions about our bulk payment solutions? Our team is here to help you get started.
            </p>

            <div className="space-y-6">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">
                  ✉
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    hello@bulkpay.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">
                  💬
                </div>
                <div>
                  <p className="text-sm text-gray-500">Live Chat</p>
                  <p className="text-sm font-medium text-gray-900">
                    Available 24/7
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Side Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg"
          >
            <div className="space-y-5">

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your payment needs..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
              >
                {submitted ? "Message Sent! ✓" : "Send Message"}
              </button>

            </div>
          </form>

        </div>
      </div>
    </section>
  );
};

export default ContactSection;