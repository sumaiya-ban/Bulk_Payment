import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
 import { Check } from "lucide-react";
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:8081/auth/login",
        { email, password },
        { withCredentials: true }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      setSuccess(res.data.message);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT SIDE (Blur Image) */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden">

        <img
          src="../transaction.jpg" // 👉 same image
          alt="bg"
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
        />

        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 p-12 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white mb-6">
            Get great rates in less than five minutes
          </h1>

         

<ul className="space-y-4 text-white text-sm">
  <li className="flex items-center gap-3">
    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-purple-600 bg-purple-600 shadow-md">
      <Check size={14} />
    </span>
    Better Exchange Rates
  </li>

  <li className="flex items-center gap-3">
    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-purple-600 bg-purple-600 shadow-md">
      <Check size={14} />
    </span>
    Low Transaction Fee
  </li>

  <li className="flex items-center gap-3">
   <span className="flex items-center justify-center w-6 h-6 rounded-full border border-purple-600 bg-purple-600 shadow-md">
      <Check size={14} />
    </span>
    No Hidden Fees
  </li>
</ul>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-200">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">

          <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
            Login
          </h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* FORGOT */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-purple-600 text-sm hover:underline"
              >
                Forget Password?
              </Link>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Login
            </button>

            {/* REGISTER */}
            <div className="text-center text-sm">
              Don't you have any account?{" "}
              <Link to="/register" className="font-semibold text-purple-600">
                Register
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;