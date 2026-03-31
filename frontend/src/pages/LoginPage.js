import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // password OR OTP
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOtpMode, setIsOtpMode] = useState(false);

  const navigate = useNavigate();

  // ================= LOGIN / VERIFY =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // 🔐 NORMAL LOGIN
      if (!isOtpMode) {
        const res = await axios.post(
          "http://localhost:8081/auth/login",
          { email, password },
          { withCredentials: true }
        );

        localStorage.setItem("user", JSON.stringify(res.data.user));
        setSuccess(res.data.message);

        navigate("/dashboard");
      }

      // 🔑 OTP VERIFY
      else {
        const res = await axios.post(
          "http://localhost:8081/auth/verify-otp",
          {
            email,
            otp: password,
          }
        );

        setSuccess(res.data.message);
        alert("✅ OTP verified! Now you can reset password");

        // 👉 OPTIONAL: redirect or open reset page
        // navigate("/reset-password");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  // ================= SEND OTP =================
  const handleSendOTP = async () => {
    if (!email) {
      setError("Enter email first");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8081/auth/send-otp",
        { email }
      );

      setSuccess(res.data.message);
      setError("");
      setIsOtpMode(true); // switch to OTP mode

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to send OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Login</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isOtpMode}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PASSWORD / OTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isOtpMode ? "Enter OTP" : "Password"}
            </label>
            <input
              type={isOtpMode ? "text" : "password"}   // ✅ FIXED
              placeholder={isOtpMode ? "Enter OTP" : "********"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* FORGET PASSWORD */}
          {/* FORGET PASSWORD */}
<div className="mb-4">
  <Link
    to="/forgot-password"
    className="text-blue-600 hover:underline"
  >
    Forget Password?
  </Link>
</div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {isOtpMode ? "Verify OTP" : "Login"}
          </button>

          <div>
            Don't you have any account?
            <Link to="/register" className="font-bold">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;