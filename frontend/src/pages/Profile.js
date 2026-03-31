import React, { useEffect, useState } from "react";
import axios from "axios";

const profileText = {
  en: {
    title: "Edit Profile",
    image: "Profile Image",
    name: "Name",
    email: "Email",
    phone: "Phone",
    occupation: "Occupation",
    address: "Present Address",
    country: "Country",
    update: "Update Profile",
  },
  bn: {
    title: "\u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2 \u098f\u09a1\u09bf\u099f",
    image: "\u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2 \u099b\u09ac\u09bf",
    name: "\u09a8\u09be\u09ae",
    email: "\u0987\u09ae\u09c7\u0987\u09b2",
    phone: "\u09ab\u09cb\u09a8",
    occupation: "\u09aa\u09c7\u09b6\u09be",
    address: "\u09ac\u09b0\u09cd\u09a4\u09ae\u09be\u09a8 \u09a0\u09bf\u0995\u09be\u09a8\u09be",
    country: "\u09a6\u09c7\u09b6",
    update: "\u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2 \u0986\u09aa\u09a1\u09c7\u099f",
  },
};

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isCustomer = storedUser.role === "customer";

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
  const [language, setLanguage] = useState(() =>
    isCustomer
      ? localStorage.getItem("customerSidebarLanguage") || "bn"
      : "en"
  );

  useEffect(() => {
    if (!isCustomer) {
      return undefined;
    }

    const syncLanguage = () => {
      setLanguage(localStorage.getItem("customerSidebarLanguage") || "bn");
    };

    window.addEventListener("customer-sidebar-language-change", syncLanguage);

    return () => {
      window.removeEventListener(
        "customer-sidebar-language-change",
        syncLanguage
      );
    };
  }, [isCustomer]);

  const currentText = isCustomer && language === "bn" ? profileText.bn : profileText.en;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

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
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...form }));
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl border">
        <h1 className="text-xl font-bold mb-4">{currentText.title}</h1>

        <div className="flex flex-col items-center mb-4">
          <img
            className="border rounded-full w-24 h-24 object-cover"
            src={
              preview ||
              `http://localhost:8081/uploads/profiles/${storedUser.image}`
            }
            alt="Profile"
          />
          <label className="mt-3 w-full text-sm font-medium text-gray-700">
            {currentText.image}
          </label>
          <input type="file" onChange={handleImage} className="mt-2 w-full" />
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentText.name}
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder={profileText.en.name}
          className="w-full border p-2 mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentText.email}
        </label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder={profileText.en.email}
          className="w-full border p-2 mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentText.phone}
        </label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder={profileText.en.phone}
          className="w-full border p-2 mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentText.occupation}
        </label>
        <input
          name="occupation"
          value={form.occupation}
          onChange={handleChange}
          placeholder={profileText.en.occupation}
          className="w-full border p-2 mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentText.address}
        </label>
        <input
          name="present_address"
          value={form.present_address}
          onChange={handleChange}
          placeholder={profileText.en.address}
          className="w-full border p-2 mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentText.country}
        </label>
        <input
          name="country"
          value={form.country}
          onChange={handleChange}
          placeholder={profileText.en.country}
          className="w-full border p-2 mb-4"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {currentText.update}
        </button>
      </div>
    </div>
  );
};

export default Profile;
