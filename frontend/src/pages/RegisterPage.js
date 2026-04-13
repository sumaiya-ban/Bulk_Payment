import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8081/auth/register",
        { email, password, name, phone },
        { withCredentials: true }
      );

      setSuccess(res.data.message);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.field) {
          setError(`${err.response.data.field}: ${err.response.data.error}`);
        } else {
          setError(err.response.data.error);
        }
      } else {
        setError("Something went wrong");
      }
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
      <li className="flex items-center gap-2">
        ✔ Better Exchange Rates
      </li>
      <li className="flex items-center gap-2">
        ✔ Low Transaction Fee
      </li>
      <li className="flex items-center gap-2">
        ✔ No Hidden Fees
      </li>
    </ul>
  </div>
</div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-200">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-md">

          <h2 className="text-2xl font-bold text-center mb-6">
            Create an account
          </h2>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

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
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
      className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
      />
    </div>
  </div>

  {/* TERMS */}
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <input type="checkbox" required />
    <span>
      I agree with <span className="text-purple-600">Terms & Conditions</span>
    </span>
  </div>

  {/* BUTTON */}
  <button
    type="submit"
    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90"
  >
    Sign Up
  </button>

  {/* LOGIN */}
  <p className="text-center text-sm">
    Already have an account?{" "}
    <Link to="/login" className="text-purple-600 font-semibold">
      Login
    </Link>
  </p>

</form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;