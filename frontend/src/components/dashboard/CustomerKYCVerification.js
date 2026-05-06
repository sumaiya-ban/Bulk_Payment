import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import axios from "axios";

const initialForm = {
  fullName: "",
  email: "",
  nationality: "",
  idType: "",
  idNumber: "",
  frontImage: null,
  backImage: null,
};

const CustomerKYCVerification = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [formData, setFormData] = useState({
    ...initialForm,
    fullName: user.name || "",
    email: user.email || "",
  });
  const [kycRecord, setKycRecord] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchKyc = async () => {
      try {
        if (!user.id) {
          return;
        }

        const res = await axios.get(
          `http://localhost:8081/auth/kyc/${user.id}`,
          { withCredentials: true }
        );

        if (!res.data) {
          return;
        }

        setKycRecord(res.data);
        setSubmitted(true);
        setFormData((prev) => ({
          ...prev,
          fullName: user.name || "",
          email: user.email || "",
          nationality: res.data.nationality || "",
          idType: res.data.document_type || "",
          idNumber: res.data.document_number || "",
        }));
      } catch (err) {
        console.error("Failed to fetch KYC:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKyc();
  }, [user.email, user.id, user.name]);

  const kycStatus = kycRecord?.status || "not_verified";
  const isApproved = kycStatus === "approved";
  const isRejected = kycStatus === "rejected";

  const steps = [
    { label: "Personal Info", status: "complete" },
    { label: "Identity Document", status: submitted ? "complete" : "current" },
    {
      label: "Verification",
      status: isApproved ? "complete" : isRejected ? "rejected" : submitted ? "current" : "upcoming",
    },
  ];

  const badgeClass = isApproved
    ? "bg-green-100 text-green-700"
    : isRejected
    ? "bg-red-100 text-red-700"
    : submitted
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-700";

  const badgeText = isApproved
    ? "Verified"
    : isRejected
    ? "Rejected"
    : submitted
    ? "Under Review"
    : "Not Verified";

  const BadgeIcon = isApproved
    ? CheckCircle
    : isRejected
    ? XCircle
    : submitted
    ? Clock
    : AlertCircle;

  const refreshKyc = async () => {
    const refreshed = await axios.get(
      `http://localhost:8081/auth/kyc/${user.id}`,
      { withCredentials: true }
    );

    setKycRecord(refreshed.data || null);
    setSubmitted(Boolean(refreshed.data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.nationality ||
      !formData.idType ||
      !formData.idNumber ||
      (!submitted && (!formData.frontImage || !formData.backImage))
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();
      data.append("nationality", formData.nationality);
      data.append("document_type", formData.idType);
      data.append("document_number", formData.idNumber);

      if (formData.frontImage) {
        data.append("front_image", formData.frontImage);
      }

      if (formData.backImage) {
        data.append("back_image", formData.backImage);
      }

      if (submitted) {
        await axios.put("http://localhost:8081/auth/kyc/update", data, {
          withCredentials: true,
        });
      } else {
        await axios.post("http://localhost:8081/auth/kyc", data, {
          withCredentials: true,
        });
      }

      await refreshKyc();
      setIsEditing(false);
      alert(submitted ? "KYC updated successfully." : "KYC submitted successfully.");
    } catch (err) {
      console.error("KYC submit error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to submit KYC.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">KYC Verification</h1>
          <p className="text-sm text-gray-500">Verify your identity</p>
        </div>

        <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${badgeClass}`}>
          <BadgeIcon size={14} />
          {badgeText}
        </div>
      </div>

      <div className="mb-8 flex items-center justify-center gap-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step.status === "complete"
                  ? "bg-blue-600 text-white"
                  : step.status === "current"
                  ? "bg-yellow-200 text-yellow-800"
                  : step.status === "rejected"
                  ? "bg-red-200 text-red-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.status === "complete" ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className="hidden text-sm sm:block">{step.label}</span>
            {i < steps.length - 1 ? <div className="h-[2px] w-8 bg-gray-300 md:w-16"></div> : null}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center text-gray-500 shadow">
          Loading KYC data...
        </div>
      ) : submitted && !isEditing ? (
        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <BadgeIcon className={isApproved ? "text-green-600" : isRejected ? "text-red-600" : "text-gray-600"} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isApproved
                  ? "KYC Verified"
                  : isRejected
                  ? "KYC Rejected"
                  : "Verification In Progress"}
              </h2>
              <p className="text-sm text-gray-500">
                {isApproved
                  ? "Your KYC has been approved by admin."
                  : isRejected
                  ? "Your KYC needs changes before it can be approved."
                  : "Your documents are being reviewed. This usually takes 1-2 business days."}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border p-4">
              <h3 className="font-semibold">Verification Details</h3>
              <p><span className="font-medium">Full Name:</span> {formData.fullName || "N/A"}</p>
              <p><span className="font-medium">Email:</span> {formData.email || "N/A"}</p>
              <p><span className="font-medium">Nationality:</span> {kycRecord?.nationality || "N/A"}</p>
              <p><span className="font-medium">Document Type:</span> {kycRecord?.document_type || "N/A"}</p>
              <p><span className="font-medium">Document Number:</span> {kycRecord?.document_number || "N/A"}</p>
              <p>
                <span className="font-medium">Submitted At:</span>{" "}
                {kycRecord?.created_at
                  ? new Date(kycRecord.created_at).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <span className="font-medium">Verified At:</span>{" "}
                {kycRecord?.verified_at
                  ? new Date(kycRecord.verified_at).toLocaleString()
                  : "Pending"}
              </p>
              <p><span className="font-medium">Notes:</span> {kycRecord?.notes || "No notes"}</p>
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <h3 className="font-semibold">Uploaded Images</h3>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Front Image</p>
                {kycRecord?.front_image ? (
                  <img
                    src={`http://localhost:8081/uploads/kyc/${kycRecord.front_image}`}
                    alt="Front KYC"
                    className="h-48 w-full rounded-lg border object-cover"
                  />
                ) : (
                  <p className="text-sm text-gray-500">No image uploaded.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Back Image</p>
                {kycRecord?.back_image ? (
                  <img
                    src={`http://localhost:8081/uploads/kyc/${kycRecord.back_image}`}
                    alt="Back KYC"
                    className="h-48 w-full rounded-lg border object-cover"
                  />
                ) : (
                  <p className="text-sm text-gray-500">No image uploaded.</p>
                )}
              </div>
            </div>
          </div>

          {!isApproved ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Edit KYC Details
              </button>

              <p className="mt-3 text-sm text-gray-500">
                If you edit and resubmit, your KYC will return to pending review.
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm text-gray-500">
              Your approved KYC is now read-only.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl bg-white p-6 shadow">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={16} /> Personal Information
            </h2>

            <input
              type="text"
              placeholder="Full Name *"
              className="w-full rounded border p-2"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />

            <input
              type="text"
              placeholder="Email *"
              className="w-full rounded border p-2"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <input
              type="text"
              placeholder="Nationality *"
              className="w-full rounded border p-2"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          </div>

          <div className="space-y-4 rounded-xl bg-white p-6 shadow">
            <h2 className="flex items-center gap-2 font-semibold">
              <Upload size={16} /> Identity Document
            </h2>

            <select
              className="w-full rounded border p-2"
              value={formData.idType}
              onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
            >
              <option value="">Select document type *</option>
              <option value="passport">Passport</option>
              <option value="nid">National ID</option>
              <option value="driving_license">Driver's License</option>
            </select>

            <input
              type="text"
              placeholder="Document Number *"
              className="w-full rounded border p-2"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
            />

            <div>
              <p className="mb-2 text-sm text-gray-600">Front Image</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, frontImage: e.target.files[0] })}
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-gray-600">Back Image</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, backImage: e.target.files[0] })}
              />
            </div>

            {submitted ? (
              <p className="text-sm text-gray-500">
                Leave image fields empty if you do not want to replace them.
              </p>
            ) : null}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : submitted ? "Update KYC" : "Submit for Verification"}
              </button>

              {submitted ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CustomerKYCVerification;
