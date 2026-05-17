import { useState } from "react";
import {
  ShieldCheck,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

import { useEffect } from "react";
import axios from "axios";
const KYCVerification = () => {
 const [formData, setFormData] = useState({
  fullName: "",
  dateOfBirth: "",
  nationality: "",
  email:"",
  idType: "",
  idNumber: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  frontImage: null,
  backImage: null,
});
useEffect(() => {
  const fetchKYC = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) return;

      // Set basic info from user
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
      }));

      // Fetch existing KYC for this user
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/auth/kyc/${user.id}`,
        { withCredentials: true }
      );

      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          nationality: res.data.nationality || "",
          idType: res.data.document_type || "",
          idNumber: res.data.document_number || "",
        }));
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Failed to fetch KYC:", err.response?.data || err.message);
    }
  };

  fetchKYC();
}, []);
  const [submitted, setSubmitted] = useState(false);
const [isEditing, setIsEditing] = useState(false);
const handleSubmit = async (e) => {
  e.preventDefault();

  

  if (
    !formData.fullName ||
    !formData.idType ||
    !formData.idNumber ||
    (!isEditing && (!formData.frontImage || !formData.backImage))
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      alert("User not logged in!");
      return;
    }

    const data = new FormData();
    data.append("user_id", user.id);
    data.append("nationality", formData.nationality);
    data.append("document_type", formData.idType);
    data.append("document_number", formData.idNumber);

    // Only append images if selected
    if (formData.frontImage) {
      data.append("front_image", formData.frontImage);
    }
    if (formData.backImage) {
      data.append("back_image", formData.backImage);
    }

    const url = isEditing
      ? `${process.env.REACT_APP_BACKEND_URL}/auth/kyc/update`
      : `${process.env.REACT_APP_BACKEND_URL}/auth/kyc`;

    const method = isEditing ? axios.put : axios.post;

    const res = await method(url, data, {
      withCredentials: true,
    });

    console.log("KYC Response:", res.data);

    setSubmitted(true);
    //setIsEditing(false);

  } catch (err) {
    console.error(
      "KYC Submit Error:",
      err.response ? err.response.data : err.message
    );
    alert("Failed to submit KYC.");
  }
};

  const steps = [
    { label: "Personal Info", status: "complete" },
    {
      label: "Identity Document",
      status: submitted ? "complete" : "current",
    },
    {
      label: "Verification",
      status: submitted === "pending" ? "rejected" : "approved",
    },
  ];
useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  setFormData((prev) => ({
    ...prev,
    fullName: user.name || "",
     email: user.email || "",
  }));
}, []);
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">KYC Verification</h1>
          <p className="text-sm text-gray-500">Verify your identity</p>
        </div>

        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
            submitted
              ? "bg-green-100 text-green-600"
              : "bg-yellow-100 text-yellow-600"
          }`}
        >
          {submitted ? <Clock size={14} /> : <AlertCircle size={14} />}
          {submitted ? "Under Review" : "Not Verified"}
        </div>
      </div>

      {/* Steps */}
      <div className="flex justify-center items-center gap-3 mb-8">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                step.status === "complete"
                  ? "bg-blue-600 text-white"
                  : step.status === "current"
                  ? "bg-gray-300"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.status === "complete" ? (
                <CheckCircle size={16} />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-sm hidden sm:block">{step.label}</span>

            {i < steps.length - 1 && (
              <div className="w-8 md:w-16 h-[2px] bg-gray-300"></div>
            )}
          </div>
        ))}
      </div>

      {/* Submitted View */}
      {submitted && !isEditing ? (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <Clock className="text-gray-600" />
          </div>
          <h2 className="text-lg font-bold mb-2">
            Verification In Progress
          </h2>
          <p className="text-gray-500 text-sm">
            Your documents are being reviewed. This usually takes 1–2
            business days.
          </p>
         <button
  onClick={() => setIsEditing(true)}
  className="w-full bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700"
>
  View KYC Verification Form
</button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {/* Personal Info */}
          <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck size={16} /> Personal Information
            </h2>

            <input
              type="text"
              placeholder="Full Name *"
              className="w-full border p-2 rounded"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
 <input
              type="text"
              placeholder="EMAIL *"
              className="w-full border p-2 rounded"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dateOfBirth: e.target.value,
                })
              }
            />

            <input
              type="text"
              placeholder="Nationality"
              className="w-full border p-2 rounded"
              value={formData.nationality}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nationality: e.target.value,
                })
              }
            />

          

           
          </div>

          {/* Document */}
          <div className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Upload size={16} /> Identity Document
            </h2>

            <select
              className="w-full border p-2 rounded"
              value={formData.idType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  idType: e.target.value,
                })
              }
            >
              <option value="">Select document type *</option>
              <option value="passport">Passport</option>
              <option value="nid">National ID</option>
              <option value="license">Driver's License</option>
            </select>

            <input
              type="text"
              placeholder="NID Number *"
              className="w-full border p-2 rounded"
              value={formData.idNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  idNumber: e.target.value,
                })
              }
            />

           

            {/* Upload Box */}
            {/* FRONT IMAGE */}
<input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setFormData({ ...formData, frontImage: e.target.files[0] })
  }
/>

<input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setFormData({ ...formData, backImage: e.target.files[0] })
  }
/>

            <button
  type="submit"
  className="w-full bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700"
   // Disable main submit if already submitted
>
  <ShieldCheck size={16} />
  {submitted ? "KYC Submitted" : "Submit for Verification"}
</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default KYCVerification;