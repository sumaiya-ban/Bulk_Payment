import { Plus, Mail, Phone, UserCircle, Trash, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Recipients = () => {
     const navigate = useNavigate();
  const [recipients, setRecipients] = useState([]);

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
    return (
       <div className="p-6 overflow-auto">
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
     <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
          Name
        </th>
        <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
          Number
        </th>
        <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
          Account Type
        </th>
        <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 ">
          Created
        </th>
        <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 ">
          Status
        </th>
        <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
          Actions
        </th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-200 ">
      {recipients.map((recipient) => (
        <tr key={recipient.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-left text-gray-800 font-medium">{recipient.name}</td>

          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
  <div className="inline-flex items-center gap-2">
    <Phone className="w-4 h-4 flex-shrink-0" />
    <span>{recipient.number}</span>
  </div>
</td>

<td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
  <div className="inline-flex items-center gap-2">
    
    <span>{recipient.account_type}</span>
  </div>
</td>

          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
            {new Date(recipient.createdAt).toLocaleDateString()}
          </td>
<td className="px-6 py-4 whitespace-nowrap text-center text-sm">
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium
      ${
        recipient.status === "active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
  >
    {recipient.status}
  </span>
</td>
          <td className="px-6  py-4 whitespace-nowrap text-right flex justify-end gap-3">
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
          </td>
        </tr>
      ))}
    </tbody>

  </table>
</div>
          )}
    </div>
    );
};

export default Recipients;
