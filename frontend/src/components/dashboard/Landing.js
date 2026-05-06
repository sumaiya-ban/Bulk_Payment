import React, { useEffect, useState } from "react";
import axios from "axios";

const Landing = () => {
  const [form, setForm] = useState({
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
    card_verified: ""
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHero();
  }, []);

  const fetchHero = async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/hero");
      setForm(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put("http://localhost:8081/api/hero", form);
      alert("Hero updated successfully!");
    } catch (err) {
      alert("Update failed");
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: "30px", maxWidth: "700px" }}>
      <h2>Edit Hero Section</h2>

      {/* Badge */}
      <input
        placeholder="Badge Text"
        value={form.badge_text}
        onChange={(e) =>
          setForm({ ...form, badge_text: e.target.value })
        }
      />

      {/* Title */}
      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
      />

      {/* Highlight */}
      <input
        placeholder="Highlight Text"
        value={form.highlight_text}
        onChange={(e) =>
          setForm({ ...form, highlight_text: e.target.value })
        }
      />

      {/* Description */}
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      <hr />

      {/* Buttons */}
      <input
        placeholder="Primary Button Text"
        value={form.primary_button_text}
        onChange={(e) =>
          setForm({ ...form, primary_button_text: e.target.value })
        }
      />

      <input
        placeholder="Primary Button Link"
        value={form.primary_button_link}
        onChange={(e) =>
          setForm({ ...form, primary_button_link: e.target.value })
        }
      />

      <input
        placeholder="Secondary Button Text"
        value={form.secondary_button_text}
        onChange={(e) =>
          setForm({ ...form, secondary_button_text: e.target.value })
        }
      />

      <input
        placeholder="Secondary Button Link"
        value={form.secondary_button_link}
        onChange={(e) =>
          setForm({ ...form, secondary_button_link: e.target.value })
        }
      />

      <hr />

      {/* Stats */}
      <input
        placeholder="Stat 1 Value"
        value={form.stat1_value}
        onChange={(e) =>
          setForm({ ...form, stat1_value: e.target.value })
        }
      />
      <input
        placeholder="Stat 1 Label"
        value={form.stat1_label}
        onChange={(e) =>
          setForm({ ...form, stat1_label: e.target.value })
        }
      />

      <input
        placeholder="Stat 2 Value"
        value={form.stat2_value}
        onChange={(e) =>
          setForm({ ...form, stat2_value: e.target.value })
        }
      />
      <input
        placeholder="Stat 2 Label"
        value={form.stat2_label}
        onChange={(e) =>
          setForm({ ...form, stat2_label: e.target.value })
        }
      />

      <input
        placeholder="Stat 3 Value"
        value={form.stat3_value}
        onChange={(e) =>
          setForm({ ...form, stat3_value: e.target.value })
        }
      />
      <input
        placeholder="Stat 3 Label"
        value={form.stat3_label}
        onChange={(e) =>
          setForm({ ...form, stat3_label: e.target.value })
        }
      />

      <hr />

      {/* Card */}
      <input
        placeholder="Card Amount"
        value={form.card_amount}
        onChange={(e) =>
          setForm({ ...form, card_amount: e.target.value })
        }
      />

      <input
        placeholder="Card Recipients"
        value={form.card_recipients}
        onChange={(e) =>
          setForm({ ...form, card_recipients: e.target.value })
        }
      />

      <input
        placeholder="Card Status"
        value={form.card_status}
        onChange={(e) =>
          setForm({ ...form, card_status: e.target.value })
        }
      />

      <input
        placeholder="Card Verified"
        value={form.card_verified}
        onChange={(e) =>
          setForm({ ...form, card_verified: e.target.value })
        }
      />

      <br /><br />

      <button onClick={handleUpdate}>
        Save Changes
      </button>
    </div>
  );
};

export default Landing;