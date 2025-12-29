import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function CreateGroup() {
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const navigate = useNavigate();

  const create = async () => {
    if (name.trim() === "") return alert("Enter group name");
    if (passcode.length !== 6) return alert("Passcode must be 6 digits");

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: tracker, error } = await supabase
      .from("trackers")
      .insert({
        name,
        type: "group",
        created_by: user.id,
        group_code: code,
        passcode,
      })
      .select("*")
      .single();

    if (error) return alert(error.message);

    await supabase.from("group_members").insert({
      tracker_id: tracker.id,
      user_id: user.id,
      role: "owner",
    });

    alert(`Group Created!\nCode: ${code}\nPasscode: ${passcode}`);
    navigate("/home");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Group</h2>

      <input
        placeholder="Group Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="6 Digit Passcode"
        maxLength={6}
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
      />

      <br /><br />

      <button onClick={create}>Create</button>
      <button onClick={() => navigate("/home")} style={{ marginLeft: 10 }}>
        Back
      </button>
    </div>
  );
}
