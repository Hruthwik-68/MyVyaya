import { useState } from "react";
import { supabase } from "../supabase";
import { useParams, useNavigate } from "react-router-dom";

export default function DeleteData() {
  const { id } = useParams();   // tracker id
  const navigate = useNavigate();

  const [scope, setScope] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const createRequest = async () => {

    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase.from("delete_requests").insert({
      tracker_id: id,
      requested_by: user?.user?.id,
      scope,
      start_date: from || null,
      end_date: to || null
    });

    if (error) return alert(error.message);

    alert("Delete request created. Waiting for group approval.");
    navigate(`/group/${id}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Delete Confirmed Records</h3>

      <p>Only confirmed data will be deleted. Pending items stay.</p>

      <select value={scope} onChange={e=>setScope(e.target.value)}>
        <option value="month">This Month</option>
        <option value="range">Select Date Range</option>
        <option value="all">All Confirmed</option>
      </select>

      {scope === "range" && (
        <>
          <br/><br/>
          From:
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <br/>
          To:
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
        </>
      )}

      <br/><br/>

      <button onClick={createRequest}>Submit Delete Request</button>
    </div>
  );
}
