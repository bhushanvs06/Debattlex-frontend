import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const url = process.env.React_App_url || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://debattlex-server-main.onrender.com');

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [displayName, setDisplayName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ show: false, type: 'idle', message: '' });
  
  const email = localStorage.getItem("userEmail");
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${url}/api/user/profile`);
        if (res.data) {
          setUserData(res.data.user);
          setTokens(res.data.user.tokens || 0);
          setDisplayName(res.data.user.displayName || '');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [email, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      alert("❌ New password and confirm password do not match.");
      return;
    }

    if (newPassword && !oldPassword) {
      alert("❌ Please provide your old password to set a new one.");
      return;
    }

    setUpdateLoading(true);
    try {
      await axios.put(`${url}/api/user/profile`, {
        displayName,
        oldPassword: oldPassword || undefined,
        password: newPassword || undefined
      });
      alert("✅ Profile updated successfully!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Error updating profile:", err);
      if (err.response && err.response.status === 401) {
        alert("❌ Incorrect old password.");
      } else {
        alert("❌ Failed to update profile.");
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleProUpgrade = async () => {
    setPaymentLoading(true);
    try {
      const isScriptLoaded = await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!isScriptLoaded) {
        alert("Failed to load payment gateway script. Please check your connection.");
        setPaymentLoading(false);
        return;
      }

      // Pro Plan is 599 INR for 1500 tokens
      const amount = 599;
      const orderRes = await axios.post(`${url}/api/razorpay/order`, { amount });
      const { orderId, amount: orderAmount, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: "INR",
        name: "Debattlex Pro",
        description: "Monthly Pro Plan: 1500 Tokens",
        image: "https://cdn-icons-png.flaticon.com/512/8422/8422267.png",
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${url}/api/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tokenPack: "pro"
            });

            if (verifyRes.data.success) {
              setTokens(verifyRes.data.tokens);
              setUserData(prev => ({ ...prev, plan: 'pro' }));
              setPaymentStatus({ show: true, type: 'success', message: verifyRes.data.message });
            } else {
              setPaymentStatus({ show: true, type: 'error', message: "Payment verification failed." });
            }
          } catch (err) {
            console.error("Verification failed:", err);
            setPaymentStatus({ show: true, type: 'error', message: "Verification failed. Please contact support." });
          }
        },
        prefill: { email: email },
        theme: { color: "#7c3aed" },
        modal: {
            ondismiss: function() {
                setPaymentLoading(false);
            }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
          setPaymentStatus({ show: true, type: 'error', message: response.error.description });
      });
      rzp.open();
    } catch (err) {
      console.error("Order creation failed:", err);
      setPaymentStatus({ show: true, type: 'error', message: "Payment creation failed. Please try again." });
    } finally {
      // Don't set paymentLoading(false) here, handle it in ondismiss or success/error so button doesn't flicker
    }
  };

  const getReadableReason = (reason) => {
    switch (reason) {
      case 'AI_JUDGE':
        return 'LLM Judge Adjudication';
      case 'AI_SPEECH_GEN':
        return 'Sarvam Speech/TTS';
      case 'AI_SUMMARY':
        return 'Debate Summarization';
      case 'PURCHASE':
        return 'Token Package Recharge';
      default:
        return reason;
    }
  };

  // Process token transactions for analytics
  const getAnalyticsData = () => {
    if (!userData || !userData.tokenTransactions) return [];
    
    const aggregated = userData.tokenTransactions.reduce((acc, tx) => {
        if (tx.amount < 0) { // Only count deductions
            const label = getReadableReason(tx.reason);
            acc[label] = (acc[label] || 0) + Math.abs(tx.amount);
        }
        return acc;
    }, {});

    return Object.entries(aggregated).map(([name, value]) => ({ name, value }));
  };

  const analyticsData = getAnalyticsData();
  const COLORS = ['#a855f7', '#34d399', '#f59e0b', '#3b82f6', '#ec4899'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(160deg,#0a0014 0%,#0f0025 55%,#080010 100%)' }}>
        <div style={{ color: '#c084fc', fontFamily: 'serif', letterSpacing: 2 }}>LOADING PROFILE...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600&display=swap');
        
        .profile-container {
          padding: 40px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .profile-header {
          font-family: 'Cinzel', serif;
          font-size: 32px;
          background: linear-gradient(90deg, #a855f7, #e879f9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 30px;
          letter-spacing: 2px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 10px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #a855f7;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
        }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.6);
        }

        .pro-card {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.15));
          border: 2px solid #a855f7;
          border-radius: 20px;
          padding: 35px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .pro-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 50%);
          animation: spin 10s linear infinite;
        }

        .pro-badge {
          position: absolute;
          top: 0;
          right: 30px;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          padding: 8px 16px;
          border-radius: 0 0 12px 12px;
          font-weight: bold;
          font-size: 14px;
          letter-spacing: 1px;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        /* Payment Animations */
        @keyframes scaleUp { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes drawCheck { 0%{stroke-dasharray:0,100} 100%{stroke-dasharray:100,0} }
        @keyframes drawCross { 0%{stroke-dashoffset: 100} 100%{stroke-dashoffset: 0} }

        .payment-modal {
            position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
            display: flex; justify-content: center; align-items: center; z-index: 10000;
        }
        .payment-content {
            background: #110022; border: 1px solid rgba(168,85,247,0.3); border-radius: 20px;
            padding: 40px; text-align: center; animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(168,85,247,0.2);
        }
        .success-svg { width: 80px; height: 80px; margin-bottom: 20px; }
        .success-circle { stroke: #34d399; stroke-width: 4; fill: none; }
        .success-check { stroke: #34d399; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; fill: none; stroke-dasharray: 100; animation: drawCheck 0.6s ease-out forwards 0.2s; }
        
        .error-svg { width: 80px; height: 80px; margin-bottom: 20px; }
        .error-circle { stroke: #ef4444; stroke-width: 4; fill: none; }
        .error-cross { stroke: #ef4444; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; fill: none; stroke-dasharray: 100; stroke-dashoffset: 100; animation: drawCross 0.6s ease-out forwards 0.2s; }

        .analytics-table-container::-webkit-scrollbar {
          width: 6px;
        }
        .analytics-table-container::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .analytics-table-container::-webkit-scrollbar-thumb {
          background: rgba(168,85,247,0.3);
          border-radius: 3px;
        }
        .analytics-table-container::-webkit-scrollbar-thumb:hover {
          background: rgba(168,85,247,0.5);
        }
      `}</style>
      
      {paymentStatus.show && (
          <div className="payment-modal">
              <div className="payment-content">
                  {paymentStatus.type === 'success' ? (
                      <svg className="success-svg" viewBox="0 0 52 52">
                          <circle className="success-circle" cx="26" cy="26" r="25"/>
                          <path className="success-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" strokeDasharray="100,100" strokeDashoffset="100"/>
                      </svg>
                  ) : (
                      <svg className="error-svg" viewBox="0 0 52 52">
                          <circle className="error-circle" cx="26" cy="26" r="25"/>
                          <path className="error-cross" d="M16 16 36 36 M36 16 16 36"/>
                      </svg>
                  )}
                  <h2 style={{ color: paymentStatus.type === 'success' ? '#34d399' : '#ef4444', marginBottom: 10 }}>
                      {paymentStatus.type === 'success' ? 'Payment Successful!' : 'Payment Failed'}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>{paymentStatus.message}</p>
                  <button className="btn-primary" onClick={() => { setPaymentStatus({show: false, type: 'idle', message: ''}); setPaymentLoading(false); }}>Close</button>
              </div>
          </div>
      )}
      
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a0014 0%,#0f0025 55%,#080010 100%)', overflowY: 'auto' }}>
        <div className="profile-container">
          <h1 className="profile-header">USER PROFILE</h1>
 
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Account Details */}
            <div className="glass-card">
              <h2 style={{ fontFamily: "'Cinzel', serif", color: '#a855f7', marginBottom: '25px', fontSize: '22px' }}>Account Details</h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="text" className="form-input" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input type="text" className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Old Password</label>
                  <input type="password" className="form-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter old password if changing..." />
                </div>
                
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                </div>
 
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                </div>
 
                <button type="submit" className="btn-primary" disabled={updateLoading} style={{ width: '100%', marginTop: '10px' }}>
                  {updateLoading ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            </div>
 
            {/* Plan & Tokens */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '5px' }}>Current Balance</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>&#129689; {tokens} Tokens</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '5px' }}>Active Plan</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: userData?.plan === 'pro' ? '#c084fc' : '#34d399' }}>
                    {userData?.plan === 'pro' ? 'Pro (1500 Credits)' : 'Standard (Free - 100 Credits)'}
                  </div>
                </div>
              </div>
 
              {/* Pro Upgrade Card */}
              <div className="pro-card">
                <div className="pro-badge">RECOMMENDED</div>
                <h3 style={{ fontSize: '28px', color: '#fff', fontFamily: "'Cinzel', serif", marginBottom: '10px', position: 'relative' }}>PRO PLAN</h3>
                <div style={{ fontSize: '42px', fontWeight: '900', color: '#c084fc', marginBottom: '15px', position: 'relative' }}>₹599<span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' }}> / month pass</span></div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 25px 0', textAlign: 'left', display: 'inline-block', position: 'relative' }}>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#34d399' }}>&#10003;</span> Receive 1500 Premium Tokens</li>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#34d399' }}>&#10003;</span> High-priority AI Judge Queue</li>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#34d399' }}>&#10003;</span> Extended Debate Time Limits</li>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#34d399' }}>&#10003;</span> Advanced Post-Debate Analytics</li>
                </ul>
 
                <button 
                  onClick={handleProUpgrade}
                  disabled={paymentLoading}
                  style={{ width: '100%', position: 'relative' }} 
                  className="btn-primary"
                >
                  {paymentLoading ? 'Connecting...' : (userData?.plan === 'pro' ? 'Already Upgraded / Add More Credits' : 'Upgrade to Pro')}
                </button>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '15px', position: 'relative' }}>
                  &#128274; Secured via Razorpay
                </div>
              </div>
 
            </div>
            
            {/* Analytics Section */}
            {analyticsData.length > 0 && (
              <div className="glass-card" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", color: '#a855f7', marginBottom: '25px', fontSize: '22px' }}>Token Consumption Analytics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          stroke="none"
                        >
                          {analyticsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: 'rgba(17, 0, 34, 0.9)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: '18px', color: '#a855f7', marginBottom: '15px' }}>Deduction Rates</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      <li style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: '600', color: '#a855f7' }}>LLM Debate Judging</span>
                          <span style={{ fontWeight: 'bold' }}>10 Tokens</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Advanced scoring, winner evaluation, feedback and review by Gemini LLM.</div>
                      </li>
                      <li style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: '600', color: '#34d399' }}>Sarvam Text-to-Speech</span>
                          <span style={{ fontWeight: 'bold' }}>5 Tokens</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>High-quality voice output using Sarvam AI Text to Speech model.</div>
                      </li>
                      <li style={{ marginBottom: '5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: '600', color: '#f59e0b' }}>AI Summarization</span>
                          <span style={{ fontWeight: 'bold' }}>1 Token</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Detailed summarization & key takeaways of your transcripts.</div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Token History Section */}
            {userData?.tokenTransactions && userData.tokenTransactions.length > 0 && (
              <div className="glass-card" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", color: '#a855f7', marginBottom: '20px', fontSize: '22px' }}>Transaction History</h2>
                <div className="analytics-table-container" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.3)', color: 'rgba(255, 255, 255, 0.6)' }}>
                        <th style={{ padding: '12px 8px' }}>Date</th>
                        <th style={{ padding: '12px 8px' }}>Action</th>
                        <th style={{ padding: '12px 8px' }}>Details</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...userData.tokenTransactions].reverse().map((tx, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px 8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                            {new Date(tx.date).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                            {getReadableReason(tx.reason)}
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                            {tx.details || '-'}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: tx.amount > 0 ? '#34d399' : '#f43f5e' }}>
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Tokens
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
