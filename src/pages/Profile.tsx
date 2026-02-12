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
      background: isOnboarding
        ? 'linear-gradient(145deg, #071a2b, #0a2540, #04111d)'
        : 'transparent',
      display: 'flex',
      justifyContent: 'center',
      alignItems: isOnboarding ? 'center' : 'flex-start',
      padding: isOnboarding ? 20 : '40px 20px'
    }}>
      <div style={{
        background: 'rgba(10, 31, 51, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: 40,
        borderRadius: 20,
        maxWidth: 520,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(26, 138, 158, 0.08)',
        border: '1px solid rgba(33, 150, 196, 0.1)',
        animation: 'fadeSlideUp 0.6s ease-out'
      }}>
        {isOnboarding && (
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #1a8a9e, #4db8d9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 10
            }}>
              Welcome to MyVyaya! 🎉
            </h1>
            <p style={{ color: '#8ba4bc', fontSize: 16 }}>
              Complete your profile to get started
            </p>
          </div>
        )}

        {!isOnboarding && (
          <h2 style={{
            marginBottom: 30,
            color: '#e8eff5',
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #e8eff5, #8ba4bc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            👤 Profile
          </h2>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14, color: '#8ba4bc', letterSpacing: '0.03em' }}>
            📧 Email
          </label>
          <p style={{
            margin: 0,
            color: "#5a7a94",
            padding: '14px 16px',
            background: 'rgba(12, 36, 58, 0.6)',
            borderRadius: 12,
            fontSize: 14,
            border: '1px solid rgba(33, 150, 196, 0.08)'
          }}>
            {email}
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14, color: '#8ba4bc', letterSpacing: '0.03em' }}>
            👤 Full Name <span style={{ color: '#f87171' }}>*</span>
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
              padding: '14px 16px',
              fontSize: 16,
              borderRadius: 12,
              border: errors.name ? "2px solid #f87171" : "1px solid rgba(33, 150, 196, 0.15)",
              outline: 'none',
              background: 'rgba(12, 36, 58, 0.6)',
              color: '#e8eff5',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
            }}
            onFocus={e => { e.target.style.borderColor = '#1a8a9e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 138, 158, 0.15)'; }}
            onBlur={e => { e.target.style.borderColor = errors.name ? '#f87171' : 'rgba(33, 150, 196, 0.15)'; e.target.style.boxShadow = 'none'; }}
          />
          {errors.name && (
            <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>
              {errors.name}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14, color: '#8ba4bc', letterSpacing: '0.03em' }}>
            📱 Phone Number <span style={{ color: '#f87171' }}>*</span>
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
              padding: '14px 16px',
              fontSize: 16,
              borderRadius: 12,
              border: errors.phone ? "2px solid #f87171" : "1px solid rgba(33, 150, 196, 0.15)",
              outline: 'none',
              background: 'rgba(12, 36, 58, 0.6)',
              color: '#e8eff5',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
            }}
            onFocus={e => { e.target.style.borderColor = '#1a8a9e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 138, 158, 0.15)'; }}
            onBlur={e => { e.target.style.borderColor = errors.phone ? '#f87171' : 'rgba(33, 150, 196, 0.15)'; e.target.style.boxShadow = 'none'; }}
          />
          {errors.phone && (
            <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>
              {errors.phone}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14, color: '#8ba4bc', letterSpacing: '0.03em' }}>
            💳 UPI ID <span style={{ color: '#f87171' }}>*</span>
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
              padding: '14px 16px',
              fontSize: 16,
              borderRadius: 12,
              border: errors.upiId ? "2px solid #f87171" : "1px solid rgba(33, 150, 196, 0.15)",
              outline: 'none',
              background: 'rgba(12, 36, 58, 0.6)',
              color: '#e8eff5',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
            }}
            onFocus={e => { e.target.style.borderColor = '#1a8a9e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 138, 158, 0.15)'; }}
            onBlur={e => { e.target.style.borderColor = errors.upiId ? '#f87171' : 'rgba(33, 150, 196, 0.15)'; e.target.style.boxShadow = 'none'; }}
          />
          {errors.upiId && (
            <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>
              {errors.upiId}
            </p>
          )}
          <p style={{ fontSize: 12, color: "#5a7a94", margin: "8px 0 0 0" }}>
            Required for receiving payments via UPI
          </p>
        </div>

        <button
          onClick={save}
          disabled={loading}
          style={{
            width: '100%',
            padding: 16,
            background: loading ? 'rgba(90, 122, 148, 0.3)' : 'linear-gradient(135deg, #1a8a9e, #2196c4)',
            color: "white",
            border: "none",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : "pointer",
            transition: 'all 0.3s ease',
            boxShadow: loading ? 'none' : '0 8px 24px rgba(26, 138, 158, 0.3)',
            letterSpacing: '0.02em'
          }}
        >
          {loading ? "⏳ Saving..." : isOnboarding ? "Complete Setup →" : "💾 Save Profile"}
        </button>

        {isOnboarding && (
          <p style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 12,
            color: '#5a7a94'
          }}>
            All fields are required to use MyVyaya
          </p>
        )}
      </div>
    </div>
  );
}