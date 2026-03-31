import { ArrowRight, Shield, Globe, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-blue-50 to-blue-100"
    >
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-blue-300 opacity-20 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-blue-400 opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-200/20 border border-blue-200/30 mb-8">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800/90">
                Trusted by 10,000+ businesses
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-blue-900">
              Send Bulk Payments{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
                Instantly
              </span>
            </h1>

            <p className="text-lg text-blue-900/70 mb-10 max-w-lg leading-relaxed">
              Process thousands of payments in a single click. Secure, fast,
              and reliable bulk payment solutions for modern businesses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base hover:brightness-110 transition"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-blue-900/20 text-blue-900 font-semibold text-base hover:bg-blue-100 transition"
              >
                Learn More
              </a>
            </div>

            <div className="flex items-center gap-8 mt-12">
              <div>
                <p className="text-2xl font-bold text-blue-900">$2B+</p>
                <p className="text-sm text-blue-900/50">Processed</p>
              </div>
              <div className="w-px h-10 bg-blue-900/20" />
              <div>
                <p className="text-2xl font-bold text-blue-900">150+</p>
                <p className="text-sm text-blue-900/50">Countries</p>
              </div>
              <div className="w-px h-10 bg-blue-900/20" />
              <div>
                <p className="text-2xl font-bold text-blue-900">99.9%</p>
                <p className="text-sm text-blue-900/50">Uptime</p>
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="w-80 h-80 rounded-3xl bg-white/50 backdrop-blur-lg border border-blue-200 p-8 flex flex-col justify-between shadow-2xl">
                <div>
                  <p className="text-sm text-blue-900/50 mb-1">Bulk Payment</p>
                  <p className="text-3xl font-bold text-blue-900">$48,250.00</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-blue-100/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-900/70">1,240 recipients</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Processing</span>
                  </div>

                  <div className="flex items-center justify-between bg-blue-100/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-900/70">Encrypted & Secure</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">✓ Verified</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-blue-500/20 flex items-center justify-center shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;