import React, { useState } from "react";
import axios from "axios";

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    name: storedUser.name || "",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    occupation: storedUser.occupation || "",
    present_address: storedUser.present_address || "",
    country: storedUser.country || "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handle image
  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // submit update
  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      if (image) {
        formData.append("image", image);
      }

      await axios.patch(
        `http://localhost:8081/auth/customer/${storedUser.id}`,
        formData,
        { withCredentials: true }
      );

      alert("Profile updated successfully");

      // update localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, ...form })
      );
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl border">

        <h1 className="text-xl font-bold mb-4">Edit Profile</h1>

        {/* IMAGE */}
        <div className="flex flex-col items-center mb-4">
          <img
            className="border rounded-full w-24 h-24 object-cover"
            src={
              preview ||
              `http://localhost:8081/uploads/profiles/${storedUser.image}`
            }
            alt="Profile"
          />
          <input type="file" onChange={handleImage} className="mt-2" />
        </div>

        {/* FORM */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full border p-2 mb-2"
        />
        <input
          name="email"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full border p-2 mb-2"
        />

        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full border p-2 mb-2"
        />

        <input
          name="occupation"
          value={form.occupation}
          onChange={handleChange}
          placeholder="Occupation"
          className="w-full border p-2 mb-2"
        />

        <input
          name="present_address"
          value={form.present_address}
          onChange={handleChange}
          placeholder="Present Address"
          className="w-full border p-2 mb-2"
        />

        <input
          name="country"
          value={form.country}
          onChange={handleChange}
          placeholder="Country"
          className="w-full border p-2 mb-4"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
};

export default Profile;