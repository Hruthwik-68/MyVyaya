import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

interface ProfileProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
}

export default function Profile({ isOnboarding = false, onComplete }: ProfileProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: "", phone: "", upiId: "" });

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

  const validate = () => {
    const newErrors = { name: "", phone: "", upiId: "" };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Full name is required";
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(phone.replace(/[^0-9]/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit phone number";
      isValid = false;
    }

    if (!upiId.trim()) {
      newErrors.upiId = "UPI ID is required";
      isValid = false;
    } else if (!upiId.includes("@")) {
      newErrors.upiId = "Enter a valid UPI ID (e.g., name@paytm)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const save = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: name.trim(),
        phone: phone.trim(),
        upi_id: upiId.trim(),
      });

      if (error) throw error;

      if (isOnboarding) {
        if (onComplete) onComplete();
        navigate("/home");
      } else {
        alert("Profile updated successfully! ✅");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: isOnboarding ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 16,
        maxWidth: 500,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {isOnboarding && (
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{ 
              fontSize: 32, 
              fontWeight: 900,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 10
            }}>
              Welcome to MyVyaya! 🎉
            </h1>
            <p style={{ color: '#666', fontSize: 16 }}>
              Complete your profile to get started
            </p>
          </div>
        )}

        {!isOnboarding && <h2 style={{ marginBottom: 30 }}>Profile</h2>}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 14 }}>
            Email
          </label>
          <p style={{ 
            margin: 0, 
            color: "#666",
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 8,
            fontSize: 14
          }}>
            {email}
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 14 }}>
            Full Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            placeholder="Enter your full name"
            value={name}
            onChange={e => {
              setName(e.target.value);
              setErrors({ ...errors, name: "" });
            }}
            style={{ 
              width: "100%", 
              padding: 12, 
              fontSize: 16,
              borderRadius: 8,
              border: errors.name ? "2px solid #ef4444" : "1px solid #ddd",
              outline: 'none'
            }}
          />
          {errors.name && (
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 5 }}>
              {errors.name}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 14 }}>
            Phone Number <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            placeholder="+91 98765 43210"
            value={phone}
            onChange={e => {
              setPhone(e.target.value);
              setErrors({ ...errors, phone: "" });
            }}
            style={{ 
              width: "100%", 
              padding: 12, 
              fontSize: 16,
              borderRadius: 8,
              border: errors.phone ? "2px solid #ef4444" : "1px solid #ddd",
              outline: 'none'
            }}
          />
          {errors.phone && (
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 5 }}>
              {errors.phone}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 30 }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 14 }}>
            UPI ID <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            placeholder="yourname@paytm or 9876543210@ybl"
            value={upiId}
            onChange={e => {
              setUpiId(e.target.value);
              setErrors({ ...errors, upiId: "" });
            }}
            style={{ 
              width: "100%", 
              padding: 12, 
              fontSize: 16,
              borderRadius: 8,
              border: errors.upiId ? "2px solid #ef4444" : "1px solid #ddd",
              outline: 'none'
            }}
          />
          {errors.upiId && (
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 5 }}>
              {errors.upiId}
            </p>
          )}
          <p style={{ fontSize: 12, color: "#666", margin: "5px 0 0 0" }}>
            💳 Required for receiving payments via UPI
          </p>
        </div>

        <button 
          onClick={save}
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            backgroundColor: loading ? '#94a3b8' : '#667eea',
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: "bold",
            cursor: loading ? 'not-allowed' : "pointer"
          }}
        >
          {loading ? "Saving..." : isOnboarding ? "Complete Setup →" : "Save Profile"}
        </button>

        {isOnboarding && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: 20, 
            fontSize: 12, 
            color: '#666' 
          }}>
            All fields are required to use MyVyaya
          </p>
        )}
      </div>
    </div>
  );
}