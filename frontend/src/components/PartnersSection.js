import React from "react";

const partners = [
  "Stripe",
  "Visa",
  "Mastercard",
  "PayPal",
  "Swift",
  "Plaid",
  "Wise",
  "Revolut",
];

const PartnersSection = () => {
  return (
    <section id="partners" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 text-center">
        
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
          Partners
        </p>

        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Trusted by Industry Leaders
        </h2>

        <p className="text-gray-600 max-w-xl mx-auto mb-16">
          We integrate with the world's leading financial infrastructure to
          ensure reliability and speed.
        </p>

        {/* Partner Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {partners.map((partner) => (
            <div
              key={partner}
              className="bg-white rounded-2xl border border-gray-200 py-8 px-6 flex items-center justify-center shadow-md hover:shadow-lg transition"
            >
              <span className="text-lg font-bold text-gray-400 tracking-wide">
                {partner}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center text-white">
          
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Scale Your Payments?
          </h3>

          <p className="mb-8 max-w-lg mx-auto text-white/80">
            Join thousands of businesses that trust BulkPay for their payment
            operations.
          </p>

          <a
            href="#contact"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-gray-100 transition"
          >
            Get Started Free
          </a>

        </div>
      </div>
    </section>
  );
};

export default PartnersSection;