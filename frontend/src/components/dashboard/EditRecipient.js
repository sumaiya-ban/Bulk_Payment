import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const EditRecipient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    number: "",
    account_type: "",
    status: "",
  });

  useEffect(() => {
    fetchReceiver();
  }, []);

  const fetchReceiver = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/receivers`);

      const receiver = res.data.find((r) => r.id == id);

      setForm({
        name: receiver.name,
        number: receiver.number,
        account_type: receiver.account_type,
        status: receiver.status,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.patch(`${process.env.REACT_APP_BACKEND_URL}/auth/receiver/${id}`, form);

      Swal.fire({
        icon: "success",
        title: "Recipient Updated",
        showConfirmButton: false,
        timer: 1500,
      });

      navigate("/dashboard/recipients");
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.response?.data?.error || "Something went wrong",
      });
    }
  };

  return (
    <div className="p-6">
          <div className="bg-white rounded-lg shadow w-full max-w-lg p-6">

            <h2 className="text-xl font-semibold mb-2">
              Update Recipient
            </h2>

            <p className="text-gray-500 mb-6">
              Update recipient information
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name
                </label>

                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              {/* Number */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>

                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={form.number}
                  onChange={(e) =>
                    setForm({ ...form, number: e.target.value })
                  }
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Type
                </label>

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

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>

                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Update Recipient
              </button>

            </form>
          </div>
    </div>
  );
};

export default EditRecipient;
