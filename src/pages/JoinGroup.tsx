import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function JoinGroup() {
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  const join = async () => {
    // get logged in user
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      alert("You must be logged in");
      return;
    }

    const codeClean = code.trim();
    const passClean = pass.trim();

    // find the group
    const { data: group, error } = await supabase
      .from("trackers")
      .select("*")
      .eq("group_code", codeClean)
      .eq("passcode", passClean)
      .eq("type", "group")
      .maybeSingle();

    if (error) {
      console.error("Lookup error:", error);
      alert("Something went wrong");
      return;
    }

    if (!group) {
      alert("Invalid Group Code or Passcode");
      return;
    }

    // check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("tracker_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await supabase
        .from("group_members")
        .insert({
          tracker_id: group.id,
          user_id: user.id,
          role: "member",
        });

      if (insertErr) {
        console.error("Insert error:", insertErr);
        alert(insertErr.message);
        return;
      }
    }

    alert("Joined group successfully!");
    navigate("/home");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Join Group</h2>

      <input
        placeholder="6 Digit Group Code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="6 Digit Passcode"
        maxLength={6}
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <br /><br />

      <button onClick={join}>Join</button>

      <button onClick={() => navigate("/home")} style={{ marginLeft: 10 }}>
        Back
      </button>
    </div>
  );
}
