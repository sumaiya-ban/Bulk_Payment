import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: send OTP, 2: verify OTP, 3: reset password
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOTP = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Enter your email");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8081/auth/send-otp", { email });
      setSuccess(res.data.message);
      setOtp("");
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setSuccess("");

    if (!otp) {
      setError("Enter OTP");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8081/auth/verify-otp", { email, otp });
      setSuccess(res.data.message);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid OTP");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Enter new password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8081/auth/reset-password", {
        email,
        newPassword,
      });
      setSuccess(res.data.message);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Forgot Password</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        {step === 1 && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="you@example.com"
            />
            <button
              onClick={handleSendOTP}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p>
              OTP sent to: <strong>{email}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
              Enter 4-digit OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="1234"
              maxLength={4}
            />
            <button
              onClick={handleVerifyOTP}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Verify OTP
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 mb-4">
              OTP matched.
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter new password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="********"
            />
            <button
              onClick={handleResetPassword}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reset Password
            </button>
          </>
        )}

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
