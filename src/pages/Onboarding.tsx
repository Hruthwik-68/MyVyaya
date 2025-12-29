import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const save = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return;

    await supabase.from("profiles").upsert({
      id: u.user.id,
      name,
      phone
    });

    navigate("/home");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Complete Your Profile</h2>

      <input
        placeholder="Your Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />

      <br /><br />

      <button onClick={save}>Save</button>
    </div>
  );
}
