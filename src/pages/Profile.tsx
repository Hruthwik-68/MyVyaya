import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    setEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, upi_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setUpiId(profile.upi_id || "");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      name,
      phone,
      upi_id: upiId
    });

    alert("Saved 🙂");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Profile</h2>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>
          Email
        </label>
        <p style={{ margin: 0, color: "#666" }}>{email}</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>
          Full Name
        </label>
        <input
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ 
            width: "100%", 
            padding: 10, 
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ddd"
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>
          Phone
        </label>
        <input
          placeholder="+91 98765 43210"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ 
            width: "100%", 
            padding: 10, 
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ddd"
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>
          UPI ID 💳
        </label>
        <input
          placeholder="yourname@paytm or 9876543210@ybl"
          value={upiId}
          onChange={e => setUpiId(e.target.value)}
          style={{ 
            width: "100%", 
            padding: 10, 
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ddd"
          }}
        />
        <p style={{ fontSize: 12, color: "#666", margin: "5px 0 0 0" }}>
          This helps friends pay you directly via UPI (PhonePe, GPay, Paytm)
        </p>
      </div>

      <button 
        onClick={save}
        style={{
          padding: "12px 24px",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Save Profile
      </button>
    </div>
  );
}