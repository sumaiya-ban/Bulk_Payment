import { useEffect, useState } from "react";
import axios from "axios";
import CustomerKYCVerification from "./CustomerKYCVerification";

const statusStyles = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

const KYCVerificationPage = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  const [adminRows, setAdminRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadKyc = async () => {
      try {
        if (!isAdmin) {
          return;
        }

        const res = await axios.get("http://localhost:8081/auth/kyc", {
          withCredentials: true,
        });
        setAdminRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load KYC:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadKyc();
  }, [isAdmin, user.id]);

  const openDetails = (row) => {
    setSelectedRow(row);
    setNotes(row.notes || "");
  };

  const closeDetails = () => {
    setSelectedRow(null);
    setNotes("");
  };

  const handleKycAction = async (status) => {
    if (!selectedRow) {
      return;
    }

    try {
      setActionLoading(true);

      const res = await axios.patch(
        `http://localhost:8081/auth/kyc/${selectedRow.id}`,
        { status, notes },
        { withCredentials: true }
      );

      const updatedRecord = res.data?.record;

      setAdminRows((prev) =>
        prev.map((row) =>
          row.id === selectedRow.id && updatedRecord ? updatedRecord : row
        )
      );

      if (updatedRecord) {
        setSelectedRow(updatedRecord);
        setNotes(updatedRecord.notes || "");
      }

      alert(res.data?.message || `KYC ${status} successfully`);
    } catch (err) {
      console.error("KYC action failed:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to update KYC status");
    } finally {
      setActionLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Nationality</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Document Number</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan="9">
                      Loading KYC data...
                    </td>
                  </tr>
                ) : adminRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan="9">
                      No KYC records found.
                    </td>
                  </tr>
                ) : (
                  adminRows.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3">{row.name || "N/A"}</td>
                      <td className="px-4 py-3">{row.email || "N/A"}</td>
                      <td className="px-4 py-3">{row.phone || "N/A"}</td>
                      <td className="px-4 py-3">{row.nationality || "N/A"}</td>
                      <td className="px-4 py-3">{row.document_type || "N/A"}</td>
                      <td className="px-4 py-3">{row.document_number || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            statusStyles[row.status] || statusStyles.pending
                          }`}
                        >
                          {row.status || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate">
                        {row.notes || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetails(row)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRow ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">KYC Details</h2>
                  <p className="text-sm text-gray-500">
                    Review customer verification data before taking action
                  </p>
                </div>
                <button
                  onClick={closeDetails}
                  className="rounded-md border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border p-4">
                  <h3 className="font-semibold text-gray-900">Customer Info</h3>
                  <p><span className="font-medium">Name:</span> {selectedRow.name || "N/A"}</p>
                  <p><span className="font-medium">Email:</span> {selectedRow.email || "N/A"}</p>
                  <p><span className="font-medium">Phone:</span> {selectedRow.phone || "N/A"}</p>
                  <p><span className="font-medium">Nationality:</span> {selectedRow.nationality || "N/A"}</p>
                  <p><span className="font-medium">Document Type:</span> {selectedRow.document_type || "N/A"}</p>
                  <p><span className="font-medium">Document Number:</span> {selectedRow.document_number || "N/A"}</p>
                  <p><span className="font-medium">Status:</span> {selectedRow.status || "pending"}</p>
                  <p>
                    <span className="font-medium">Created At:</span>{" "}
                    {selectedRow.created_at
                      ? new Date(selectedRow.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Verified At:</span>{" "}
                    {selectedRow.verified_at
                      ? new Date(selectedRow.verified_at).toLocaleString()
                      : "Not verified yet"}
                  </p>
                </div>

                <div className="space-y-4 rounded-xl border p-4">
                  <h3 className="font-semibold text-gray-900">NID Images</h3>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Front Image</p>
                    {selectedRow.front_image ? (
                      <img
                        src={`http://localhost:8081/uploads/kyc/${selectedRow.front_image}`}
                        alt="Front document"
                        className="h-48 w-full rounded-lg border object-cover"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No image found.</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Back Image</p>
                    {selectedRow.back_image ? (
                      <img
                        src={`http://localhost:8081/uploads/kyc/${selectedRow.back_image}`}
                        alt="Back document"
                        className="h-48 w-full rounded-lg border object-cover"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No image found.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add review notes for this KYC request"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => handleKycAction("rejected")}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Reject"}
                </button>
                <button
                  onClick={() => handleKycAction("approved")}
                  disabled={actionLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Accept"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return <CustomerKYCVerification />;
};

export default KYCVerificationPage;
