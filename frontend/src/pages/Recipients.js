import { Plus, Mail, Phone, UserCircle, Trash, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Users, CheckCircle, XCircle } from "lucide-react";
const Recipients = () => {
     const navigate = useNavigate();
  const [recipients, setRecipients] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const rowsPerPage = 5;
  useEffect(() => {
  fetchRecipients();
}, []);

const fetchRecipients = async () => {
  try {
    const res = await axios.get("http://localhost:8081/auth/receivers");
    setRecipients(res.data);
  } catch (error) {
    console.error("Error fetching recipients", error);
  }
};
const totalPages = Math.ceil(recipients.length / rowsPerPage);

const startIndex = (currentPage - 1) * rowsPerPage;

const paginatedRecipients = recipients.slice(
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
      await axios.delete(`http://localhost:8081/auth/receiver/${id}`);

      Swal.fire("Deleted!", "Recipient has been deleted.", "success");

      fetchRecipients();
    } catch (error) {
      Swal.fire("Error!", "Delete failed.", "error");
    }
    }
  };
  const totalRecipients = recipients.length;
const activeRecipients = recipients.filter(r => r.status === "active").length;
const inactiveRecipients = recipients.filter(r => r.status !== "active").length;
    return (
       <div className="p-6 overflow-auto">
        {/* HEADER */}
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Recipients</h1>
    <p className="text-sm text-gray-500">
      Manage and track all your recipients in one place
    </p>
  </div>

  <button
    onClick={() => navigate("/dashboard/recipients/create")}
    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
  >
    <Plus className="w-4 h-4" />
    Add Recipient
  </button>
</div>

{/* STATS CARDS */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
  
  {/* TOTAL */}
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
      <Users className="text-blue-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">Total</p>
      <h2 className="text-xl font-bold text-gray-800">{totalRecipients}</h2>
    </div>
  </div>

  {/* ACTIVE */}
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
      <CheckCircle className="text-green-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">Active</p>
      <h2 className="text-xl font-bold text-gray-800">{activeRecipients}</h2>
    </div>
  </div>

  {/* INACTIVE */}
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
      <XCircle className="text-red-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">Inactive</p>
      <h2 className="text-xl font-bold text-gray-800">{inactiveRecipients}</h2>
    </div>
  </div>

</div>
          {recipients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-10 text-center flex flex-col items-center">
              <UserCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Recipient yet</h2>
              <p className="text-gray-500 mb-6">
                Create your first Recipient to get started.
              </p>
              <button
                onClick={() => navigate("/dashboard/recipients/create")}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Recipients
              </button>
            </div>
          ) : (
            <div className="w-full overflow-y-auto">
  <table className="min-w-[700px] overflow-y-auto  w-full bg-white rounded-lg shadow divide-y divide-gray-200">
    <thead className="bg-gray-200 text-black">
  <tr>
    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
    <th className="px-6 py-3 text-left text-sm font-semibold">Number</th>
    <th className="px-6 py-3 text-left text-sm font-semibold">Account Type</th>
    <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
    <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
    <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
  </tr>
</thead>

    <tbody className="divide-y divide-gray-200 ">
      {paginatedRecipients.map((recipient) => (
        <tr key={recipient.id} className="hover:bg-gray-50">
  {/* NAME */}
  <td className="px-6 py-4 text-left text-gray-800 font-medium">
    {recipient.name}
  </td>

  {/* NUMBER */}
  <td className="px-6 py-4 text-gray-600 text-sm">
    <div className="flex items-center gap-2">
      <Phone className="w-4 h-4" />
      <span>{recipient.number}</span>
    </div>
  </td>

  {/* ACCOUNT TYPE */}
  <td className="px-6 py-4 text-gray-600 text-sm">
    {recipient.account_type}
  </td>

  {/* CREATED */}
  <td className="px-6 py-4 text-gray-500 text-sm">
    {new Date(recipient.createdAt).toLocaleDateString()}
  </td>

  {/* STATUS */}
  <td className="px-6 py-4 text-center">
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        recipient.status === "active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {recipient.status}
    </span>
  </td>

  {/* ACTIONS */}
  <td className="px-6 py-4 text-center">
    <div className="flex justify-center gap-3">
      <button
        onClick={() => navigate(`/dashboard/recipients/edit/${recipient.id}`)}
        className="text-blue-600 hover:text-blue-800"
      >
        <Edit className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleDelete(recipient.id)}
        className="text-red-600 hover:text-red-800"
      >
        <Trash className="w-4 h-4" />
      </button>
    </div>
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

export default Recipients;
