import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../constants";

const heroDefaults = {
  badge_text: "",
  title: "",
  highlight_text: "",
  description: "",
  primary_button_text: "",
  primary_button_link: "",
  secondary_button_text: "",
  secondary_button_link: "",
  stat1_value: "",
  stat1_label: "",
  stat2_value: "",
  stat2_label: "",
  stat3_value: "",
  stat3_label: "",
  card_amount: "",
  card_recipients: "",
  card_status: "",
  card_verified: "",
};

const servicesDefaults = {
  badge_text: "",
  title: "",
  description: "",
  service1_icon: "",
  service1_title: "",
  service1_description: "",
  service2_icon: "",
  service2_title: "",
  service2_description: "",
  service3_icon: "",
  service3_title: "",
  service3_description: "",
  service4_icon: "",
  service4_title: "",
  service4_description: "",
  service5_icon: "",
  service5_title: "",
  service5_description: "",
  service6_icon: "",
  service6_title: "",
  service6_description: "",
};

const transactionDefaults = {
  badge_text: "",
  title: "",
  description: "",
  feature1: "",
  feature2: "",
  feature3: "",
  feature4: "",
  feature5: "",
  feature6: "",
  card_title: "",
  card_badge_text: "",
  tx1_name: "",
  tx1_amount: "",
  tx1_status: "",
  tx1_count: "",
  tx2_name: "",
  tx2_amount: "",
  tx2_status: "",
  tx2_count: "",
  tx3_name: "",
  tx3_amount: "",
  tx3_status: "",
  tx3_count: "",
  tx4_name: "",
  tx4_amount: "",
  tx4_status: "",
  tx4_count: "",
};

const partnersDefaults = {
  title: "",
  partner1_name: "",
  partner1_logo: "",
  partner2_name: "",
  partner2_logo: "",
  partner3_name: "",
  partner3_logo: "",
  partner4_name: "",
  partner4_logo: "",
  partner5_name: "",
  partner5_logo: "",
  partner6_name: "",
  partner6_logo: "",
};

const footerDefaults = {
  brand_text: "",
  description: "",
  product_title: "",
  product_link1_label: "",
  product_link1_href: "",
  product_link2_label: "",
  product_link2_href: "",
  product_link3_label: "",
  product_link3_href: "",
  product_link4_label: "",
  product_link4_href: "",
  company_title: "",
  company_link1_label: "",
  company_link1_href: "",
  company_link2_label: "",
  company_link2_href: "",
  company_link3_label: "",
  company_link3_href: "",
  company_link4_label: "",
  company_link4_href: "",
  legal_title: "",
  legal_link1_label: "",
  legal_link1_href: "",
  legal_link2_label: "",
  legal_link2_href: "",
  legal_link3_label: "",
  legal_link3_href: "",
  copyright_text: "",
};
const thStyle = {
  padding: "12px",
  textAlign: "left",
  
  fontWeight: "600",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
};

const editBtnStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const saveBtnStyle = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const deleteBtnStyle = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
};

const cancelBtnStyle = {
  background: "#ffffff",
  color: "#374151",
  border: "1px solid #d1d5db",
  padding: "10px 20px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

const addBtnStyle = {
  background: "#16a34a",
  color: "#ffffff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};
const sectionConfig = {
  home: {
    label: "Home Section",
    endpoint: "/api/hero",
    defaults: heroDefaults,
  },
  services: {
    label: "Services Section",
    endpoint: "/api/services-section",
    defaults: servicesDefaults,
  },
  transactions: {
    label: "Transactions Section",
    endpoint: "/api/transaction-section",
    defaults: transactionDefaults,
  },
  partners: {
    label: "Partners Section",
    endpoint: "/api/partners-section",
    defaults: partnersDefaults,
  },
  footer: {
    label: "Footer Section",
    endpoint: "/api/footer-section",
    defaults: footerDefaults,
  },
};

const MAX_PARTNERS = 6;

const fieldGroups = {
  home: [
    { title: "Hero Content", fields: ["badge_text", "title", "highlight_text", "description"] },
    { title: "Buttons", fields: ["primary_button_text", "primary_button_link", "secondary_button_text", "secondary_button_link"] },
    { title: "Stats", fields: ["stat1_value", "stat1_label", "stat2_value", "stat2_label", "stat3_value", "stat3_label"] },
    { title: "Card", fields: ["card_amount", "card_recipients", "card_status", "card_verified"] },
  ],
  services: [
    { title: "Section Header", fields: ["badge_text", "title", "description"] },
    ...[1, 2, 3, 4, 5, 6].map((num) => ({
      title: `Service Card ${num}`,
      fields: [`service${num}_icon`, `service${num}_title`, `service${num}_description`],
    })),
  ],
  transactions: [
    { title: "Section Header", fields: ["badge_text", "title", "description"] },
    { title: "Feature List", fields: ["feature1", "feature2", "feature3", "feature4", "feature5", "feature6"] },
    { title: "Transaction Card Header", fields: ["card_title", "card_badge_text"] },
    ...[1, 2, 3, 4].map((num) => ({
      title: `Transaction Row ${num}`,
      fields: [`tx${num}_name`, `tx${num}_amount`, `tx${num}_status`, `tx${num}_count`],
    })),
  ],
  partners: [
    { title: "Section Header", fields: ["title"] },
    ...[1, 2, 3, 4, 5, 6].map((num) => ({
      title: `Partner ${num}`,
      fields: [`partner${num}_name`, `partner${num}_logo`],
    })),
  ],
  footer: [
    { title: "Brand", fields: ["brand_text", "description", "copyright_text"] },
    { title: "Product Links", fields: ["product_title", "product_link1_label", "product_link1_href", "product_link2_label", "product_link2_href", "product_link3_label", "product_link3_href", "product_link4_label", "product_link4_href"] },
    { title: "Company Links", fields: ["company_title", "company_link1_label", "company_link1_href", "company_link2_label", "company_link2_href", "company_link3_label", "company_link3_href", "company_link4_label", "company_link4_href"] },
    { title: "Legal Links", fields: ["legal_title", "legal_link1_label", "legal_link1_href", "legal_link2_label", "legal_link2_href", "legal_link3_label", "legal_link3_href"] },
  ],
  
};

const prettify = (field) =>
  field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const isLongField = (field) =>
  field.includes("description") || field.includes("copyright");

const isServiceIconField = (field) =>
  /^service\d+_icon$/.test(field);

const getImageSrc = (value) => {
  if (!value) return "";
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:image")) {
    return value;
  }
  if (value.startsWith("/uploads/")) {
    return `${BASE_URL}${value}`;
  }
  return "";
};

const getVisiblePartnerCount = (partnersForm = {}) => {
  const usedSlots = [1, 2, 3, 4, 5, 6].filter(
    (num) =>
      partnersForm[`partner${num}_name`] ||
      partnersForm[`partner${num}_logo`]
  );

  return Math.min(MAX_PARTNERS, Math.max(3, usedSlots.length || 3));
};

const Landing = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [forms, setForms] = useState({
    home: heroDefaults,
    services: servicesDefaults,
    transactions: transactionDefaults,
    partners: partnersDefaults,
    footer: footerDefaults,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visiblePartnerCount, setVisiblePartnerCount] = useState(3);
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: "", logo: "" });
  const [editingPartner, setEditingPartner] = useState(null);
  const [uploadingServiceIcons, setUploadingServiceIcons] = useState({});

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    marginTop: "6px",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "100px",
    resize: "vertical",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "14px",
  };

  const sectionStyle = {
    background: "#f0faff",
    borderRadius: "16px",
     padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    marginBottom: "24px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const entries = await Promise.all(
          Object.entries(sectionConfig).map(async ([key, config]) => {
            const res = await axios.get(`${BASE_URL}${config.endpoint}`);
            return [key, { ...config.defaults, ...(res.data || {}) }];
          })
        );

        const nextForms = Object.fromEntries(entries);
        setForms(nextForms);
        setVisiblePartnerCount(getVisiblePartnerCount(nextForms.partners));
      } catch (err) {
        console.log("Failed to load landing CMS data", err);
        alert("Failed to load some landing CMS data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (section, field, value) => {
    setForms((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const config = sectionConfig[activeSection];

    try {
      setSaving(true);
      await axios.put(`${BASE_URL}${config.endpoint}`, forms[activeSection]);
      alert(`${config.label} updated successfully!`);
    } catch (err) {
      console.log(err);
      alert(`${config.label} update failed`);
    } finally {
      setSaving(false);
    }
  };

  const handleServiceIconUpload = async (field, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("icon", file);

    try {
      setUploadingServiceIcons((prev) => ({ ...prev, [field]: true }));
      const res = await axios.post(
        `${BASE_URL}/api/services-section/icon-upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      handleChange("services", field, res.data.url || "");
    } catch (err) {
      console.log(err);
      alert("Service icon upload failed");
    } finally {
      setUploadingServiceIcons((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleAddPartner = () => {
    setShowAddPartnerForm(true);
  };

  const handleCreatePartner = () => {
    const nextSlot = Array.from({ length: MAX_PARTNERS }, (_, index) => index + 1).find(
      (num) =>
        !forms.partners[`partner${num}_name`] &&
        !forms.partners[`partner${num}_logo`]
    );

    if (!nextSlot) {
      return;
    }

    setForms((prev) => ({
      ...prev,
      partners: {
        ...prev.partners,
        [`partner${nextSlot}_name`]: newPartner.name,
        [`partner${nextSlot}_logo`]: newPartner.logo,
      },
    }));
    setVisiblePartnerCount((current) => Math.max(current, nextSlot));
    setNewPartner({ name: "", logo: "" });
    setShowAddPartnerForm(false);
    setEditingPartner(nextSlot);
  };

  const handleCancelPartner = () => {
    setNewPartner({ name: "", logo: "" });
    setShowAddPartnerForm(false);
  };

  const handleDeletePartner = (num) => {
    setForms((prev) => ({
      ...prev,
      partners: {
        ...prev.partners,
        [`partner${num}_name`]: "",
        [`partner${num}_logo`]: "",
      },
    }));

    if (editingPartner === num) {
      setEditingPartner(null);
    }
  };

  const handleSavePartnerRow = () => {
    setEditingPartner(null);
  };

  const renderField = (field) => {
    const value = forms[activeSection]?.[field] || "";
    const imageSrc = getImageSrc(value);

    if (activeSection === "services" && isServiceIconField(field)) {
      return (
        <label key={field} style={labelStyle}>
          {prettify(field)}
          <input
            style={inputStyle}
            value={value}
            placeholder="Icon keyword, image URL, or uploaded image path"
            onChange={(e) => handleChange(activeSection, field, e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            style={{ ...inputStyle, padding: "10px 12px" }}
            disabled={uploadingServiceIcons[field]}
            onChange={(e) => handleServiceIconUpload(field, e.target.files?.[0])}
          />
          {uploadingServiceIcons[field] ? (
            <span style={{ color: "#6b7280", fontSize: "13px" }}>Uploading...</span>
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt={prettify(field)}
              style={{
                width: "54px",
                height: "54px",
                objectFit: "contain",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#ffffff",
                marginTop: "8px",
                display: "block",
              }}
            />
          ) : (
            <span style={{ color: "#6b7280", fontSize: "13px" }}>
              Use CARD, USERS, CHART, CLOCK, SHIELD, GLOBE, or upload an image.
            </span>
          )}
        </label>
      );
    }

    const commonProps = {
      style: isLongField(field) ? textareaStyle : inputStyle,
      value,
      onChange: (e) => handleChange(activeSection, field, e.target.value),
    };

    return (
      <label key={field} style={labelStyle}>
        {prettify(field)}
        {isLongField(field) ? <textarea {...commonProps} /> : <input {...commonProps} />}
      </label>
    );
  };

  const renderPartnersSection = () => (
  <>
    <div style={sectionStyle}>
      <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>
        Section Header
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {renderField("title")}
      </div>
    </div>

    {/* ADD PARTNER FORM */}
    {showAddPartnerForm && (
      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>
          Add Partner
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          <label style={labelStyle}>
            Partner Name
            <input
              style={inputStyle}
              value={newPartner.name}
              onChange={(e) =>
                setNewPartner((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </label>

          <label style={labelStyle}>
            Logo URL
            <input
              style={inputStyle}
              value={newPartner.logo}
              onChange={(e) =>
                setNewPartner((prev) => ({ ...prev, logo: e.target.value }))
              }
            />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "12px",
          }}
        >
          <button onClick={handleCancelPartner} style={cancelBtnStyle}>
            Cancel
          </button>

          <button
            onClick={handleCreatePartner}
            disabled={!newPartner.name}
            style={addBtnStyle}
          >
            Add To Table
          </button>
        </div>
      </div>
    )}

    {/* PARTNERS TABLE */}
    <div style={sectionStyle}>
      
      {/* HEADER + BUTTON FLEX */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          backgroundColor: "#e1e6e8",
          padding: "16px",
          // borderRadius: "12px",
          
        }}
      >
        <h2 style={{ margin: 0, color: "#111827", fontSize: "20px", fontWeight: "700" }}>
          Partners Table
        </h2>

        <button
          onClick={handleAddPartner}
          disabled={visiblePartnerCount >= MAX_PARTNERS || showAddPartnerForm}
          style={{
            background:
              visiblePartnerCount >= MAX_PARTNERS || showAddPartnerForm
                ? "#9ca3af"
                : "#2563eb",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor:
              visiblePartnerCount >= MAX_PARTNERS || showAddPartnerForm
                ? "not-allowed"
                : "pointer",
          }}
        >
          {visiblePartnerCount >= MAX_PARTNERS
            ? "Maximum Partners Added"
            : "Add Partner"}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "720px",
            backgroundColor: "#ffffff",
          }}
        >
          <thead>
            <tr style={{ background: "#ebf1f2", color: "#000000" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Logo URL</th>
              <th style={thStyle}>Preview</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: visiblePartnerCount }, (_, index) => index + 1).map(
              (num) => (
                <tr key={num}>
                  <td style={tdStyle}>{num}</td>

                  <td style={tdStyle}>
                    <input
                      style={{ ...inputStyle, marginTop: 0 }}
                      disabled={editingPartner !== num}
                      value={forms.partners[`partner${num}_name`] || ""}
                      onChange={(e) =>
                        handleChange("partners", `partner${num}_name`, e.target.value)
                      }
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      style={{ ...inputStyle, marginTop: 0 }}
                      disabled={editingPartner !== num}
                      value={forms.partners[`partner${num}_logo`] || ""}
                      onChange={(e) =>
                        handleChange("partners", `partner${num}_logo`, e.target.value)
                      }
                    />
                  </td>

                  <td style={tdStyle}>
                    {forms.partners[`partner${num}_logo`] ? (
                      <img
                        src={forms.partners[`partner${num}_logo`]}
                        alt={forms.partners[`partner${num}_name`] || `Partner ${num}`}
                        style={{
                          width: "72px",
                          height: "42px",
                          objectFit: "contain",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          background: "#ffffff",
                        }}
                      />
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        No logo
                      </span>
                    )}
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {editingPartner === num ? (
                        <button onClick={handleSavePartnerRow} style={saveBtnStyle}>
                          Save
                        </button>
                      ) : (
                        <button onClick={() => setEditingPartner(num)} style={editBtnStyle}>
                          Edit
                        </button>
                      )}

                      <button
                        onClick={() => handleDeletePartner(num)}
                        style={deleteBtnStyle}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "600", color: "#6b7280" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "30px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700", color: "#111827" }}>
                Landing Page CMS
              </h1>
              <p style={{ marginTop: "8px", color: "#6b7280", fontSize: "15px" }}>
                Manage landing page content from one place.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? "rgb(22,163,74)" : "rgb(22,163,74)",
                color: "rgb(255,255,255)",
                border: "none",
                padding: "14px 28px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {Object.entries(sectionConfig).map(([key, tab]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: activeSection === key ? "1px solid rgb(22,163,74)" : "1px solid #d1d5db",
                  background: activeSection === key ? "rgb(22,163,74)" : "#ffffff",
                  color: activeSection === key ? "#ffffff" : "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: activeSection === key ? "0 4px 10px rgba(37, 99, 235, 0.25)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeSection === "partners" ? (
          renderPartnersSection()
        ) : (
          fieldGroups[activeSection].map((group) => (
            <div key={group.title} style={sectionStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#111827" }}>
                {group.title}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                {group.fields.map(renderField)}
              </div>
            </div>
          ))
        )}

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#9ca3af" : "#16a34a",
              color: "#ffffff",
              border: "none",
              padding: "14px 40px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)",
            }}
          >
            {saving ? "Saving..." : `Save ${sectionConfig[activeSection].label}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
