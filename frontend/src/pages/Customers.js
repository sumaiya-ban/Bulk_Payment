import { Plus, Mail, Phone, UserCircle, Trash, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
  fetchCustomers();
}, []);
const [currentPage, setCurrentPage] = useState(1);
const rowsPerPage = 5;
const fetchCustomers = async () => {
  try {
    const res = await axios.get("http://localhost:8081/auth/customers");
    setCustomers(res.data);
  } catch (error) {
    console.error("Error fetching customers", error);
  }
};
const totalPages = Math.ceil(customers.length / rowsPerPage);

const startIndex = (currentPage - 1) * rowsPerPage;

const paginatedCustomers = customers.slice(
  startIndex,
  startIndex + rowsPerPage
);
 
 const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`http://localhost:8081/auth/customer/${id}`);

      Swal.fire("Deleted!", "Customer has been deleted.", "success");

      fetchCustomers();
    } catch (error) {
      Swal.fire("Error!", "Delete failed.", "error");
    }
  }
  };
  return (
    <div className="p-6 overflow-auto">
          {customers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-10 text-center flex flex-col items-center">
              <UserCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No customers yet</h2>
              <p className="text-gray-500 mb-6">
                Create your first customer to get started.
              </p>
              <button
                onClick={() => navigate("/dashboard/customers/create")}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Customer
              </button>
            </div>
          ) : (
            <div className="w-full overflow-y-auto ">
  <table className="min-w-[700px] overflow-y-auto  w-full bg-white rounded-lg shadow divide-y divide-gray-200">
     <thead className="bg-gray-200 text-black">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-semibold">
          Name
        </th>
        <th className="px-6 py-3 text-center text-sm font-semibold">
          Email
        </th>
        <th className="px-6 py-3 text-center text-sm font-semibold">
          Phone
        </th>
        <th className="px-6 py-3 text-center text-sm font-semibold">
          Created
        </th>
        <th className="px-6 py-3 text-center text-sm font-semibold">
          Status
        </th>
        <th className="px-6 py-3 text-center text-sm font-semibold">
          Actions
        </th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-200 ">
      {paginatedCustomers.map((customer) => (
        <tr key={customer.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-left text-gray-800 font-medium">{customer.name}</td>

          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
  <div className="inline-flex items-center gap-2">
    <Mail className="w-4 h-4 flex-shrink-0" />
    <span>{customer.email}</span>
  </div>
</td>

<td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
  <div className="inline-flex items-center gap-2">
    <Phone className="w-4 h-4 flex-shrink-0" />
    <span>{customer.phone}</span>
  </div>
</td>

          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
            {new Date(customer.createdAt).toLocaleDateString()}
          </td>
<td className="px-6 py-4 whitespace-nowrap text-center text-sm">
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium
      ${
        customer.status === "active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
  >
    {customer.status}
  </span>
</td>
          <td className="px-6  py-4 whitespace-nowrap text-right flex justify-end gap-3">
            <button
  onClick={() => navigate(`/dashboard/customers/edit/${customer.id}`)}
  className="text-blue-600 hover:text-blue-800"
>
  <Edit className="w-4 h-4" />
</button>
            <button
              onClick={() => handleDelete(customer.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash className="w-4 h-4" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>

  </table>
  <div className="flex items-center justify-between mt-4 px-2">
  <p className="text-sm text-gray-600">
    Page {currentPage} of {totalPages || 1}
  </p>

  <div className="flex gap-2">
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
    >
      Prev
    </button>

    <button
      onClick={() =>
        setCurrentPage((p) => Math.min(p + 1, totalPages))
      }
      disabled={currentPage === totalPages}
      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>
</div>
          )}
    </div>
  );
};

export default Customers;
