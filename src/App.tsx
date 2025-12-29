import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import CreateGroup from "./pages/CreateGroup";
import Personal from "./pages/Personal";
import JoinGroup from "./pages/JoinGroup";
import Group from "./pages/Group";
import Navbar from "./components/Navbar";
import Onboarding from "./pages/Onboarding";
import Friends from "./pages/Friends";
function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { queryParams: { prompt: "select_account consent" } },
    });
  };

  if (loading) return <p>Loading…</p>;

  return (
    <>
      {user && <Navbar />}

      <Routes>

        {/* root redirects AFTER we know auth */}
        <Route
          path="/"
          element={<Navigate to={user ? "/home" : "/home"} replace />}
        />

        {/* Home */}
        <Route
          path="/home"
          element={
            user
              ? <Home />
              : (
                <div style={{ padding: 20 }}>
                  <h1>Money Tracker</h1>
                  <button onClick={login}>Login with Google</button>
                </div>
              )
          }
        />

        {/* Protected routes */}
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/home" />} />
        <Route path="/create-group" element={user ? <CreateGroup /> : <Navigate to="/home" />} />
        <Route path="/personal" element={user ? <Personal /> : <Navigate to="/home" />} />
        <Route path="/join-group" element={user ? <JoinGroup /> : <Navigate to="/home" />} />
        <Route path="/group/:id" element={user ? <Group /> : <Navigate to="/home" />} />
        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/home" />} />
<Route path="/friends" element={<Friends />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </>
  );
}

export default App;
