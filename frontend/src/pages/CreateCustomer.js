import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const CreateCustomer = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      // Send POST request to backend
      const res = await axios.post(
        "http://localhost:8081/auth/register",
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          type: "customer", 
          status:"active",
        }
      );

      alert(res.data.message || "Customer created successfully");
      navigate("/dashboard/customers"); 
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create customer");
    }
  };

  return (
    <div className="p-6">
          <div className="bg-white rounded-lg shadow w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-2">New Customer</h2>
            <p className="text-gray-500 mb-6">Fill in the details to create a new customer</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="********"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Create Customer
              </button>
            </form>
          </div>
    </div>
  );
};

export default CreateCustomer;
