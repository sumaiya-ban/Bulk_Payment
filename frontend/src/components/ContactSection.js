import React, { useState } from "react";
import { CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import { BASE_URL } from "../constants";

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
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      await res.json();

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
    <section id="contact" className="py-24 bg-[#071712]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-300 mb-5">
              Contact Us
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Let's Talk Payments
            </h2>

            <p className="text-white/70 mb-10 leading-relaxed max-w-xl">
              Have questions about our bulk payment solutions? Our team is here
              to help you get started.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="w-12 h-12 rounded-2xl bg-green-500/15 border border-green-400/25 flex items-center justify-center text-green-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Email</p>
                  <p className="text-sm font-medium text-white">
                    hello@bulkpay.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="w-12 h-12 rounded-2xl bg-green-500/15 border border-green-400/25 flex items-center justify-center text-green-300">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Live Chat</p>
                  <p className="text-sm font-medium text-white">
                    Available 24/7
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your payment needs..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:brightness-110 transition shadow-lg"
              >
                {submitted ? (
                  <>
                    Message Sent
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
