import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status:"",
  });

  useEffect(() => {
    fetchCustomer();
  }, []);

  const fetchCustomer = async () => {
    try {
      const res = await axios.get(`http://localhost:8081/auth/customers`);

      const customer = res.data.find((c) => c.id == id);

      setForm({
        name: customer.name,
        phone: customer.phone,
        status:customer.status,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.patch(`http://localhost:8081/auth/customer/${id}`, form);

      Swal.fire({
        icon: "success",
        title: "Customer Updated",
        showConfirmButton: false,
        timer: 1500,
      });

      // Use absolute path starting with "/"
      navigate("/dashboard/customers");
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
    <div className="  min-h-screen ">
      <form
        onSubmit={handleSubmit}
        className="bg-white  p-6  "
      >
        <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Phone"
          value={form.phone}
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <div className="w-full border">
          <select  value={form.status} className="w-full border-none" onChange={(e)=>setForm({...form, status: e.target.value})}>
          <option value="active">Active</option>
<option value="inactive">Inactive</option>
        </select>
        </div>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Update Customer
        </button>
      </form>
    </div>
  );
};

export default EditCustomer;
