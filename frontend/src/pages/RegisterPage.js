import React, { useState,useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
 import { Check } from "lucide-react";
const RegisterPage = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
const [showOtpModal, setShowOtpModal] = useState(false);
const [otpType, setOtpType] = useState("sms");

const [otp, setOtp] = useState(["", "", "", ""]);
const [formData, setFormData] = useState(null);
const handleOtpChange = (value, index) => {
  if (!/^[0-9]?$/.test(value)) return; 

  const newOtp = [...otp];
  newOtp[index] = value;
  setOtp(newOtp);

  // auto move to next box
  if (value && index < 3) {
    document.getElementById(`otp-${index + 1}`).focus();
  }
};
 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }
if (otpType === "sms" && !phone) {
  setError("Phone number is required for SMS OTP");
  return;
}
  try {
    // 🔥 Call backend OTP API
  await axios.post("http://localhost:8081/auth/send-otp", {
  ...(otpType === "sms" ? { phone } : { email }),
  purpose: "register",
});
    setFormData({ name, email, phone, password });
    setShowOtpModal(true);

  } catch (err) {
    setError(err.response?.data?.error || "Failed to send OTP");
  }
};
useEffect(() => {
  const fetchOtpType = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8081/auth/settings",
        { withCredentials: true }
      );

      const otpSetting = res.data.find(
        (s) => s.setting_key === "otp_type"
      );

      if (otpSetting) {
        setOtpType(otpSetting.setting_value); // "sms" or "email"
      }
    } catch (err) {
      console.error("Failed to fetch OTP type", err);
    }
  };

  fetchOtpType();
}, []);
const verifyOtpAndRegister = async () => {
  const enteredOtp = otp.join("");

  if (enteredOtp.length < 4) {
    setError("Enter valid OTP");
    return;
  }

  try {
    // 🔥 VERIFY OTP FROM BACKEND
   await axios.post("http://localhost:8081/auth/verify-otp", {
  email,
  phone,
  otp: enteredOtp,
  purpose: "register",
});
    // 🔥 THEN REGISTER USER
    const res = await axios.post(
      "http://localhost:8081/auth/register",
      formData
    );

    setSuccess(res.data.message);
    setShowOtpModal(false);
    setOtp(["", "", "", ""]);

  } catch (err) {
    setError(err.response?.data?.error || "OTP verification failed");
  }
};
  return (
    <div className="min-h-screen flex">
      
     
      {/* LEFT SIDE */}
<div className="hidden md:flex w-1/2 relative overflow-hidden">

  {/* Background Image */}
  
  <img
    src="../transaction.jpg" 
    alt="bg"
    className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
  />

  {/* Overlay */}
  <div className="absolute inset-0 bg-black/60"></div>

  {/* Content */}
  <div className="relative z-10 p-12 flex flex-col justify-center">
    <h1 className="text-3xl font-bold text-white mb-6">
      Get great rates in less than five minutes
    </h1>

   <ul className="space-y-4 text-white text-sm">
  <li className="flex items-center gap-3">
    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-primary bg-primary shadow-md">
      <Check size={14} />
    </span>
    Better Exchange Rates
  </li>

  <li className="flex items-center gap-3">
    <span className="flex items-center justify-center w-6 h-6 rounded-full border border-primary bg-primary shadow-md">
      <Check size={14} />
    </span>
    Low Transaction Fee
  </li>

  <li className="flex items-center gap-3">
   <span className="flex items-center justify-center w-6 h-6 rounded-full border border-primary bg-primary shadow-md">
      <Check size={14} />
    </span>
    No Hidden Fees
  </li>
</ul>
  </div>
</div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-primary-light via-primary/70 to-primary-light">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-md">

          <h2 className="text-2xl font-bold text-center mb-6 text-primary-dark">
            Create an account
          </h2>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && <p className="text-primary text-sm mb-3">{success}</p>}

         <form onSubmit={handleSubmit} className="space-y-4">

  {/* NAME + PHONE (split like first/last name) */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm text-gray-600">Name</label>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Mobile</label>
      <input
        type="text"
        placeholder="Enter phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
      />
    </div>
  </div>

  {/* EMAIL */}
  <div>
    <label className="text-sm text-gray-600">Email</label>
    <input
      type="email"
      placeholder="Enter email address"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
    />
  </div>

  {/* PASSWORDS (split like image) */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm text-gray-600">Password</label>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
      />
    </div>

    <div>
      <label className="text-sm text-gray-600">Confirm Password</label>
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
      />
    </div>
  </div>

  {/* TERMS */}
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <input type="checkbox" required />
    <span>
      I agree with <span className="text-primary">Terms & Conditions</span>
    </span>
  </div>

  {/* BUTTON */}
  <button
    type="submit"
    className="w-full py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:opacity-90"
  >
    Sign Up
  </button>

  {/* LOGIN */}
  <p className="text-center text-sm">
    Already have an account?{" "}
    <Link to="/login" className="text-primary font-semibold">
      Login
    </Link>
  </p>

</form>
        </div>
      </div>
      {showOtpModal &&  (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-xl w-[350px] shadow-lg">

     <h3 className="text-lg font-semibold mb-2 text-center">
  {otpType === "sms" ? "SMS Verification" : "Email Verification"}
</h3>

<p className="text-sm text-gray-500 text-center mb-4">
  OTP sent to your {otpType === "sms" ? "mobile number" : "email"}
</p>

      <div className="flex justify-between gap-2 mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, index)}
            className="w-12 h-12 text-center text-lg border rounded-lg"
          />
        ))}
      </div>

      <button
        onClick={verifyOtpAndRegister}
        className="w-full py-2 bg-primary text-white rounded-lg"
      >
        Verify SMS OTP
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default RegisterPage;