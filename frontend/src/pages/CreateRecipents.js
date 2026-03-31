import React from 'react';
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
const CreateRecipents = () => {
     const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    number: "",
    account_type: "",
    status: "",
  });

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.name || !form.number || !form.account_type ) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await axios.post(
      "http://localhost:8081/auth/receiver",
      {
        name: form.name,
        number: form.number,
        account_type: form.account_type,
        status: form.status,
      }
    );

    alert(res.data.message || "Receiver created successfully");
    navigate("/dashboard/recipients");
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.error || "Failed to create receiver");
  }
};
    return (
         <div className="p-6">
          <div className="bg-white rounded-lg shadow w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-2">New Recipients</h2>
            <p className="text-gray-500 mb-6">Fill in the details to create a new Recipients</p>

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

             

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
              </div>

              {/* Password */}
             <div>
<label className="block text-sm font-medium mb-1">Account Type</label>

<select
  className="w-full border rounded px-3 py-2"
  value={form.account_type}
  onChange={(e) =>
    setForm({ ...form, account_type: e.target.value })
  }
>
  <option value="">Select Account</option>
  <option value="bkash">Bkash</option>
  <option value="nagad">Nagad</option>
  <option value="rocket">Rocket</option>
</select>
</div>
               {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1">status</label>
                <div className="w-full border">
          <select  value={form.status} className="w-full border-none" onChange={(e)=>setForm({...form, status: e.target.value})}>
          <option value="active">Active</option>
<option value="inactive">Inactive</option>
        </select>
        </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Create Recipents
              </button>
            </form>
          </div>
    </div>
    );
};

export default CreateRecipents;
