import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowRight, Shield, Globe, Zap } from "lucide-react";

const HeroSection = () => {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    fetchHero();
  }, []);

  const fetchHero = async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/hero");
      setHero(res.data);
    } catch (err) {
      console.log("Hero fetch error:", err);
    }
  };

  if (!hero) return <div>Loading...</div>;

  return (
    <section
  id="home"
  className="relative overflow-hidden min-h-screen flex items-center"
  style={{
    backgroundImage: `
      linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)),
      url('/sendora_emotional.png')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
      {/* Optional background blur decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-green-300 opacity-10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-green-400 opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200 mb-8 shadow-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-800">
                {hero.badge_text}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              {hero.title}{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-500">
                {hero.highlight_text}
              </span>
            </h1>

            <p className="text-lg text-white mb-10 max-w-lg leading-relaxed">
              {hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={hero.primary_button_link}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-green-500 text-white font-semibold text-base hover:brightness-110 transition shadow-lg"
              >
                {hero.primary_button_text}
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href={hero.secondary_button_link}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-900/10 text-blue-900 font-semibold text-base hover:bg-white transition shadow-sm"
              >
                {hero.secondary_button_text}
              </a>
            </div>

            <div className="flex items-center gap-8 mt-12 flex-wrap">
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {hero.stat1_value}
                </p>
                <p className="text-sm text-green-500">
                  {hero.stat1_label}
                </p>
              </div>

              <div className="w-px h-10 bg-blue-900/20" />

              <div>
                <p className="text-2xl font-bold text-green-500">
                  {hero.stat2_value}
                </p>
                <p className="text-sm text-green-500">
                  {hero.stat2_label}
                </p>
              </div>

              <div className="w-px h-10 bg-blue-900/20" />

              <div>
                <p className="text-2xl font-bold text-green-500">
                  {hero.stat3_value}
                </p>
                <p className="text-sm text-green-500">
                  {hero.stat3_label}
                </p>
              </div>
            </div>
          </div>

          {/* Right Card */}
         <div className="hidden lg:flex justify-center">
  <div className="relative">
    {/* Transparent Glass Card */}
    <div className="w-80 h-80 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 flex flex-col justify-between shadow-2xl">
      <div>
        <p className="text-sm text-white/70 mb-1">
          Sendora Payment
        </p>
        <p className="text-3xl font-bold text-green-400">
          {hero.card_amount}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 border border-white/10">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/80">
              {hero.card_recipients}
            </span>
          </div>
          <span className="text-xs text-green-400 font-medium">
            {hero.card_status}
          </span>
        </div>

        <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 border border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/80">
              Encrypted & Secure
            </span>
          </div>
          <span className="text-xs text-green-400 font-medium">
            {hero.card_verified}
          </span>
        </div>
      </div>
    </div>

    {/* Floating Icon */}
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
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