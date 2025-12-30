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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="coin"></div>
          <div className="coin-shadow"></div>
        </div>
        <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loader {
            position: relative;
          }
          .coin {
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            border-radius: 50%;
            position: relative;
            animation: flip 1.5s infinite ease-in-out;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.4);
          }
          .coin::before {
            content: '₹';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
          }
          .coin-shadow {
            width: 60px;
            height: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 50%;
            position: absolute;
            top: 70px;
            left: 0;
            animation: shadowPulse 1.5s infinite ease-in-out;
          }
          @keyframes flip {
            0%, 100% { transform: rotateY(0deg) translateY(0); }
            50% { transform: rotateY(180deg) translateY(-20px); }
          }
          @keyframes shadowPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(0.8); opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}

      <Routes>
  <Route
    path="/"
    element={user ? <Navigate to="/home" /> : <VyayaLoginPage login={login} />}
  />

  <Route
    path="/home"
    element={user ? <Home /> : <Navigate to="/" />}
  />

  <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
  <Route path="/create-group" element={user ? <CreateGroup /> : <Navigate to="/" />} />
  <Route path="/personal" element={user ? <Personal /> : <Navigate to="/" />} />
  <Route path="/join-group" element={user ? <JoinGroup /> : <Navigate to="/" />} />
  <Route path="/group/:id" element={user ? <Group /> : <Navigate to="/" />} />
  <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/" />} />
  <Route path="/friends" element={user ? <Friends /> : <Navigate to="/" />} />

  <Route path="*" element={<Navigate to="/" />} />
</Routes>

    </>
  );
}

// VYAYA LOGIN PAGE WITH MIND-BLOWING ANIMATIONS
function VyayaLoginPage({ login }: { login: () => void }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="vyaya-login">
      {/* Animated Background */}
      <div className="bg-animation">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          >
            {particle.id % 3 === 0 ? '💰' : particle.id % 3 === 1 ? '💸' : '💵'}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="login-container">
        {/* Logo with Stacked Coins */}
        <div className="logo-section">
          <div className="logo-wrapper">
            <div className="coin-container">
              <div className="coin coin-1">
                <span className="coin-symbol">₹</span>
              </div>
              <div className="coin coin-2">
                <span className="coin-symbol">₹</span>
              </div>
              <div className="coin coin-3">
                <span className="coin-symbol">₹</span>
              </div>
            </div>
            <div className="logo-glow"></div>
            <div className="logo-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <div className="brand-section">
 <h1 style={{ 
  fontSize: 'clamp(42px, 10vw, 72px)',
  fontWeight: 900,
  marginBottom: '10px',
  lineHeight: 1.2,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',  /* Changed from baseline to center */
  gap: '8px',
  flexWrap: 'wrap',
  textAlign: 'center',   /* Added */
  width: '100%'          /* Added */
}}>
  <span style={{
    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
    display: 'inline-block'
  }}>My</span>
  <span style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 20px rgba(102, 126, 234, 0.5))',
    animation: 'gradientFlow 4s ease infinite',
    display: 'inline-block'
  }}>Vyaya</span>
</h1>
  <div className="brand-subtitle">
    <span className="subtitle-star">★</span>
    <span className="subtitle-text">A HNB Product</span>
    <span className="subtitle-star">★</span>
  </div>
</div>

        {/* Feature Tags */}
        <div className="feature-tags">
          <div className="tag tag-1">
            <span className="tag-icon">📊</span>
            <span className="tag-text">Track Expenses</span>
          </div>
          <div className="tag tag-2">
            <span className="tag-icon">📸</span>
            <span className="tag-text">Scan Receipts</span>
          </div>
          <div className="tag tag-3">
            <span className="tag-icon">👥</span>
            <span className="tag-text">Split Bills</span>
          </div>
        </div>

        {/* Google Signup Button */}
        <button className="google-btn" onClick={login}>
          <div className="btn-bg"></div>
          <div className="btn-content">
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="btn-text">Sign up with Google</span>
          </div>
          <div className="btn-shine"></div>
          <div className="btn-ripple"></div>
        </button>

        {/* Footer Note */}
        <p className="footer-note">
          <span className="note-icon">🔒</span>
          Free forever • Secure & Private
        </p>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden;
        }

        .vyaya-login {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #0a0e27;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        }

        /* ===== ANIMATED BACKGROUND ===== */
        .bg-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          animation: orbFloat 25s infinite ease-in-out;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #667eea, #764ba2);
          top: -200px;
          left: -200px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #f093fb, #f5576c);
          bottom: -150px;
          right: -150px;
          animation-delay: 8s;
        }

        .orb-3 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, #4facfe, #00f2fe);
          top: 40%;
          left: 60%;
          animation-delay: 15s;
        }

        @keyframes orbFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(150px, -150px) scale(1.1);
          }
          50% {
            transform: translate(-100px, 100px) scale(0.9);
          }
          75% {
            transform: translate(100px, 150px) scale(1.05);
          }
        }

        .grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        /* ===== FLOATING PARTICLES ===== */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          font-size: 24px;
          animation: floatUp 20s infinite ease-in-out;
          opacity: 0;
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 0;
          }
        }

        /* ===== MAIN CONTAINER ===== */
        .login-container {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 40px 20px;
          max-width: 500px;
          width: 100%;
        }

        /* ===== LOGO SECTION ===== */
        .logo-section {
          margin-bottom: 50px;
          animation: logoEntrance 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes logoEntrance {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .logo-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
          margin: 0 auto;
        }

        .coin-container {
          position: relative;
          width: 160px;
          height: 160px;
          perspective: 1000px;
          animation: containerRotate 30s linear infinite;
        }

        @keyframes containerRotate {
          from { transform: rotateZ(0deg); }
          to { transform: rotateZ(360deg); }
        }

        .coin {
          position: absolute;
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffa500 100%);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 
            0 10px 40px rgba(255, 215, 0, 0.4),
            inset 0 -5px 15px rgba(0, 0, 0, 0.2),
            inset 0 5px 15px rgba(255, 255, 255, 0.4);
          border: 3px solid #ffa500;
        }

        .coin-symbol {
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .coin-1 {
          left: 30px;
          top: 0;
          z-index: 3;
          animation: coinFloat1 3s ease-in-out infinite;
        }

        .coin-2 {
          left: 30px;
          top: 15px;
          z-index: 2;
          transform: scale(0.95);
          opacity: 0.9;
          animation: coinFloat2 3s ease-in-out infinite;
        }

        .coin-3 {
          left: 30px;
          top: 30px;
          z-index: 1;
          transform: scale(0.9);
          opacity: 0.8;
          animation: coinFloat3 3s ease-in-out infinite;
        }

        @keyframes coinFloat1 {
          0%, 100% { transform: translateY(0) rotateY(0deg); }
          50% { transform: translateY(-15px) rotateY(180deg); }
        }

        @keyframes coinFloat2 {
          0%, 100% { transform: scale(0.95) translateY(0) rotateY(0deg); }
          50% { transform: scale(0.95) translateY(-12px) rotateY(180deg); }
        }

        @keyframes coinFloat3 {
          0%, 100% { transform: scale(0.9) translateY(0) rotateY(0deg); }
          50% { transform: scale(0.9) translateY(-10px) rotateY(180deg); }
        }

        .logo-glow {
          position: absolute;
          width: 160px;
          height: 160px;
          top: 0;
          left: 0;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.8;
          }
        }

        .logo-rings {
          position: absolute;
          top: 0;
          left: 0;
          width: 160px;
          height: 160px;
        }

        .ring {
          position: absolute;
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-radius: 50%;
          animation: ringExpand 4s ease-out infinite;
        }

        .ring-1 {
          width: 160px;
          height: 160px;
          top: 0;
          left: 0;
          animation-delay: 0s;
        }

        .ring-2 {
          width: 160px;
          height: 160px;
          top: 0;
          left: 0;
          animation-delay: 1.3s;
        }

        .ring-3 {
          width: 160px;
          height: 160px;
          top: 0;
          left: 0;
          animation-delay: 2.6s;
        }

        @keyframes ringExpand {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* ===== BRAND SECTION ===== */
        .brand-section {
          margin-bottom: 40px;
        }

        .brand-name {
          font-size: clamp(42px, 10vw, 72px);
          font-weight: 900;
          margin-bottom: 10px;
          line-height: 1.1;
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .brand-my {
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInLeft 0.8s ease-out;
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

       .brand-vyaya {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientFlow 4s ease infinite;
  filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.5));
  display: inline-block; /* ADD THIS - CRITICAL! */
}
        @keyframes gradientFlow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .letter {
          display: inline-block;
          animation: letterWave 2s ease-in-out infinite;
        }

        .letter:nth-child(1) { animation-delay: 0s; }
        .letter:nth-child(2) { animation-delay: 0.1s; }
        .letter:nth-child(3) { animation-delay: 0.2s; }
        .letter:nth-child(4) { animation-delay: 0.3s; }
        .letter:nth-child(5) { animation-delay: 0.4s; }

        @keyframes letterWave {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(5deg);
          }
        }

        .brand-subtitle {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          letter-spacing: 2px;
          animation: fadeInUp 1s ease-out 0.3s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .subtitle-star {
          color: #ffd700;
          animation: starTwinkle 2s ease-in-out infinite;
          font-size: 18px;
        }

        @keyframes starTwinkle {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) rotate(180deg);
          }
        }

        .subtitle-text {
          text-transform: uppercase;
          background: linear-gradient(90deg, #fff, #ccc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ===== FEATURE TAGS ===== */
        .feature-tags {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 50px;
          flex-wrap: wrap;
          padding: 0 10px;
        }

        .tag {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 18px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          animation: tagFloat 3s ease-in-out infinite;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
        }

        .tag-1 { animation-delay: 0s; }
        .tag-2 { animation-delay: 1s; }
        .tag-3 { animation-delay: 2s; }

        @keyframes tagFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .tag:hover {
          transform: translateY(-5px) scale(1.05);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .tag-icon {
          font-size: 16px;
        }

        /* ===== GOOGLE BUTTON ===== */
        .google-btn {
          position: relative;
          width: 100%;
          max-width: 350px;
          padding: 18px 32px;
          background: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          overflow: hidden;
          margin: 0 auto 30px;
          display: block;
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          animation: buttonEntrance 1s ease-out 0.8s both;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes buttonEntrance {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .google-btn:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 
            0 20px 60px rgba(102, 126, 234, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2);
        }

        .google-btn:active {
          transform: translateY(-2px) scale(0.98);
        }

        .btn-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .google-btn:hover .btn-bg {
          opacity: 1;
        }

        .btn-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }

        .google-icon {
          flex-shrink: 0;
        }

        .btn-text {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
        }

        .btn-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 70%
          );
          transform: rotate(45deg);
          animation: shine 4s ease-in-out infinite;
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          20% {
            transform: translateX(-100%) rotate(45deg);
          }
          40% {
            transform: translateX(100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) rotate(45deg);
          }
        }

        .btn-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(102, 126, 234, 0.3);
          transform: translate(-50%, -50%);
          animation: rippleEffect 3s ease-out infinite;
        }

        @keyframes rippleEffect {
          0% {
            width: 0;
            height: 0;
            opacity: 0.8;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }

        /* ===== FOOTER NOTE ===== */
        .footer-note {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          animation: fadeInUp 1s ease-out 1s both;
        }

        .note-icon {
          font-size: 14px;
          animation: lockPulse 2s ease-in-out infinite;
        }

        @keyframes lockPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 640px) {
          .login-container {
            padding: 30px 15px;
          }

          .logo-wrapper {
            width: 130px;
            height: 130px;
          }

          .coin-container {
            width: 130px;
            height: 130px;
          }

          .coin {
            width: 80px;
            height: 80px;
          }

          .coin-symbol {
            font-size: 36px;
          }

          .coin-1 { left: 25px; }
          .coin-2 { left: 25px; }
          .coin-3 { left: 25px; }

          .logo-glow {
            width: 130px;
            height: 130px;
          }

          .ring {
            width: 130px !important;
            height: 130px !important;
          }

          .brand-subtitle {
            font-size: 14px;
            gap: 8px;
          }

          .feature-tags {
            gap: 8px;
            margin-bottom: 40px;
          }

          .tag {
            padding: 8px 14px;
            font-size: 12px;
          }

          .tag-icon {
            font-size: 14px;
          }

          .google-btn {
            max-width: 300px;
            padding: 16px 28px;
          }

          .btn-text {
            font-size: 15px;
          }

          .footer-note {
            font-size: 12px;
          }

          .gradient-orb {
            filter: blur(70px);
          }

          .orb-1 {
            width: 400px;
            height: 400px;
          }

          .orb-2 {
            width: 350px;
            height: 350px;
          }

          .orb-3 {
            width: 300px;
            height: 300px;
          }

          .particle {
            font-size: 18px;
          }
        }

        @media (max-width: 380px) {
          .logo-wrapper {
            width: 110px;
            height: 110px;
          }

          .coin-container {
            width: 110px;
            height: 110px;
          }

          .coin {
            width: 70px;
            height: 70px;
          }

          .coin-symbol {
            font-size: 30px;
          }

          .coin-1 { left: 20px; }
          .coin-2 { left: 20px; }
          .coin-3 { left: 20px; }

          .brand-name {
            flex-direction: column;
            gap: 4px;
          }

          .brand-subtitle {
            font-size: 12px;
          }

          .tag {
            padding: 6px 12px;
            font-size: 11px;
          }

          .google-btn {
            padding: 14px 24px;
          }

          .btn-text {
            font-size: 14px;
          }
        }

        /* LANDSCAPE MODE */
        @media (max-height: 600px) and (orientation: landscape) {
          .logo-section {
            margin-bottom: 20px;
          }

          .logo-wrapper {
            width: 100px;
            height: 100px;
          }

          .coin-container {
            width: 100px;
            height: 100px;
          }

          .coin {
            width: 60px;
            height: 60px;
          }

          .coin-symbol {
            font-size: 28px;
          }

          .coin-1 { left: 20px; }
          .coin-2 { left: 20px; }
          .coin-3 { left: 20px; }

          .brand-section {
            margin-bottom: 20px;
          }

          .feature-tags {
            margin-bottom: 25px;
          }

          .google-btn {
            margin-bottom: 15px;
          }
            
        }
      `}</style>
    </div>
  );
}

export default App;