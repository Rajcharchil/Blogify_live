'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithGithub } = useAuth();
  const [formData, setFormData] = useState({ email: '', username: '', password: '', fullName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData.email, formData.username, formData.password, formData.fullName || undefined);
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSocialLoading('google');
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGithub = async () => {
    setError('');
    setSocialLoading('github');
    try {
      await loginWithGithub();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub sign in failed');
    } finally {
      setSocialLoading(null);
    }
  };

  const passwordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++; 
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
      { label: '', color: 'transparent' },
      { label: 'Weak', color: '#ef4444' },
      { label: 'Fair', color: '#f97316' },
      { label: 'Good', color: '#eab308' },
      { label: 'Strong', color: '#10b981' },
    ];
    return { score, ...map[score] };
  };

  const strength = passwordStrength(formData.password);
  const pwd = formData.password;
  const checks = {
    length: pwd.length >= 8,
    number: /[0-9]/.test(pwd),
    upper:  /[A-Z]/.test(pwd),
  };
  const usernameValid = formData.username.length >= 3 && !/\s/.test(formData.username);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0f0a 100%)',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,20px) scale(1.06)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-25px) scale(1.04)} }
        @keyframes float1 { 0%,100%{transform:translateY(0) translateX(0);opacity:.5} 50%{transform:translateY(-40px) translateX(12px);opacity:1} }
        @keyframes float2 { 0%,100%{transform:translateY(0) translateX(0);opacity:.3} 50%{transform:translateY(-55px) translateX(-18px);opacity:.9} }
        @keyframes float3 { 0%,100%{transform:translateY(0) translateX(0);opacity:.4} 50%{transform:translateY(-30px) translateX(20px);opacity:.8} }
        @keyframes float4 { 0%,100%{transform:translateY(0);opacity:.25} 50%{transform:translateY(-45px);opacity:.7} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes slideInErr { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes bob      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: all 0.25s;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: rgba(16,185,129,0.65);
          background: rgba(16,185,129,0.06);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
          transform: scale(1.01);
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }

        .auth-btn {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: linear-gradient(270deg, #10b981, #14b8a6, #0ea5e9, #10b981);
          background-size: 300% 300%;
          color: #fff; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(16,185,129,0.45);
          animation: shimmer 2s linear infinite;
        }
        .auth-btn:active:not(:disabled) { transform: scale(0.98); }
        .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .social-btn {
          width: 100%; padding: 13px 16px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.22s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .social-btn:hover:not(:disabled) {
          background: rgba(16,185,129,0.07);
          border-color: rgba(16,185,129,0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(16,185,129,0.12);
        }
        .social-btn:active:not(:disabled) { transform: scale(0.98); }
        .social-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .show-btn {
          background: none; border: none; color: rgba(255,255,255,0.4);
          cursor: pointer; padding: 4px; transition: color 0.2s;
        }
        .show-btn:hover { color: rgba(255,255,255,0.8); }

        .logo-icon  { animation: bob 3.5s ease-in-out infinite; }
        .error-box  { animation: slideInErr 0.25s ease forwards; }
      `}</style>

      {/* ── Background ── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        {/* Blob 1 — top-left green */}
        <div style={{ position:'absolute', top:'-8%', left:'-8%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%)', animation:'blob1 9s ease-in-out infinite' }} />
        {/* Blob 2 — bottom-right indigo */}
        <div style={{ position:'absolute', bottom:'-10%', right:'-8%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.10) 0%,transparent 70%)', animation:'blob2 11s ease-in-out infinite' }} />
        {/* Blob 3 — center teal */}
        <div style={{ position:'absolute', top:'40%', left:'35%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle,rgba(20,184,166,0.06) 0%,transparent 70%)', animation:'blob1 18s ease-in-out infinite reverse' }} />
        {/* Particles */}
        {[
          { w:4, h:4, top:'12%', left:'10%', anim:'float1 7s ease-in-out infinite' },
          { w:3, h:3, top:'75%', left:'85%', anim:'float2 9s ease-in-out infinite 1s' },
          { w:5, h:5, top:'50%', left:'5%',  anim:'float3 11s ease-in-out infinite 2s' },
          { w:3, h:3, top:'20%', left:'90%', anim:'float4 8s ease-in-out infinite 0.5s' },
          { w:2, h:2, top:'88%', left:'30%', anim:'float1 10s ease-in-out infinite 3s' },
          { w:3, h:3, top:'8%',  left:'60%', anim:'float3 14s ease-in-out infinite 4s' },
        ].map((p, i) => (
          <div key={i} style={{ position:'absolute', top:p.top, left:p.left, width:`${p.w}px`, height:`${p.h}px`, borderRadius:'50%', background:'rgba(16,185,129,0.6)', animation:p.anim, boxShadow:'0 0 6px rgba(16,185,129,0.4)' }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', zIndex:1 }}>
        <div style={{ width:'100%', maxWidth:'440px', animation:'fadeUp 0.5s ease forwards' }}>

          {/* Brand text */}
          <div style={{ textAlign:'center', marginBottom:'6px' }}>
            <span style={{ fontSize:'13px', fontWeight:'700', letterSpacing:'4px', background:'linear-gradient(90deg,#10b981,#14b8a6,#10b981)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textTransform:'uppercase' }}>BLOGIFY</span>
          </div>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div className="logo-icon" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'56px', height:'56px', borderRadius:'16px', background:'linear-gradient(135deg,#10b981,#14b8a6)', marginBottom:'14px', boxShadow:'0 0 30px rgba(16,185,129,0.45),0 0 60px rgba(16,185,129,0.15)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize:'22px', fontWeight:'700', color:'#fff', letterSpacing:'-0.5px' }}>Create your account</div>
            <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)', marginTop:'4px' }}>Join thousands of creators on BLOGIFY</div>
          </div>

          {/* Card */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'22px', padding:'32px', backdropFilter:'blur(24px)', boxShadow:'0 0 40px rgba(16,185,129,0.05),inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            {/* Error */}
            {error && (
              <div className="error-box" style={{ marginBottom:'20px', padding:'12px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'10px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginTop:'1px' }}>
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize:'13px', color:'#fca5a5', lineHeight:'1.5' }}>{error}</span>
              </div>
            )}

            {/* Social */}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' }}>
              <button id="register-google-btn" className="social-btn" onClick={handleGoogle} disabled={!!socialLoading || loading} type="button">
                {socialLoading === 'google' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path d="M43.611 20.083H42V20H24v8h11.303C33.978 32.663 29.427 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.54 10.459C34.05 7.197 29.282 5 24 5 13.507 5 5 13.507 5 24s8.507 19 19 19c10.2 0 18.573-7.583 18.994-17.374.027-.636.006-1.278-.006-1.919z" fill="#FFC107"/>
                    <path d="M6.306 14.691L12.557 19.18c1.717-4.518 6.117-7.68 10.943-7.68 3.059 0 5.842 1.154 7.961 3.039L37.54 10.459C34.05 7.197 29.282 5 24 5c-7.697 0-14.358 4.337-17.694 10.691z" fill="#FF3D00"/>
                    <path d="M24 43c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 34.091 26.715 35 24 35c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 43 24 43z" fill="#4CAF50"/>
                    <path d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.641 45 30.401 45 24c0-1.328-.139-2.624-.389-3.917z" fill="#1976D2"/>
                  </svg>
                )}
                {socialLoading === 'google' ? 'Signing up...' : 'Sign up with Google'}
              </button>

              <button id="register-github-btn" className="social-btn" onClick={handleGithub} disabled={!!socialLoading || loading} type="button">
                {socialLoading === 'github' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                {socialLoading === 'github' ? 'Signing up...' : 'Sign up with GitHub'}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap' }}>or with email</span>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Full name + username */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'8px' }}>Full name</label>
                  <input id="register-fullname" name="fullName" className="auth-input" value={formData.fullName} onChange={handleChange} placeholder="John Doe" autoComplete="name" />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'8px' }}>
                    Username
                    {formData.username && (
                      <span style={{ marginLeft:'6px', fontSize:'11px', color: usernameValid ? '#10b981' : '#f97316' }}>
                        {usernameValid ? '✓ valid' : '3+ chars, no spaces'}
                      </span>
                    )}
                  </label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)', fontSize:'15px', pointerEvents:'none' }}>@</span>
                    <input
                      id="register-username" name="username" className="auth-input"
                      value={formData.username} onChange={handleChange}
                      placeholder="username" required
                      style={{ paddingLeft:'28px', paddingRight: usernameValid ? '36px' : '16px', borderColor: formData.username ? (usernameValid ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)') : undefined }}
                    />
                    {usernameValid && (
                      <span style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', color:'#10b981', fontSize:'16px' }}>✓</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'8px' }}>Email address</label>
                <input id="register-email" type="email" name="email" className="auth-input" value={formData.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" />
              </div>

              {/* Password */}
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'500', color:'rgba(255,255,255,0.6)', marginBottom:'8px' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    id="register-password" type={showPassword ? 'text' : 'password'} name="password"
                    className="auth-input" value={formData.password} onChange={handleChange}
                    placeholder="Min. 6 characters" required autoComplete="new-password"
                    style={{ paddingRight:'48px' }}
                  />
                  <button type="button" id="register-toggle-password" className="show-btn" onClick={() => setShowPassword(!showPassword)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)' }}>
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>

                {/* Strength bar */}
                {formData.password && (
                  <div style={{ marginTop:'10px' }}>
                    <div style={{ display:'flex', gap:'5px', marginBottom:'8px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:'4px', borderRadius:'99px', background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)', transition:'background 0.35s, box-shadow 0.35s', boxShadow: i <= strength.score ? `0 0 6px ${strength.color}80` : 'none' }} />
                      ))}
                    </div>
                    {/* Requirement checks */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      {([
                        ['length', '8+ characters'],
                        ['number', 'Contains a number'],
                        ['upper',  'Contains uppercase'],
                      ] as [keyof typeof checks, string][]).map(([key, label]) => (
                        <div key={key} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color: checks[key] ? '#10b981' : 'rgba(255,255,255,0.3)', transition:'color 0.2s' }}>
                          <span style={{ fontSize:'13px', fontWeight:'700', lineHeight:1 }}>{checks[key] ? '✓' : '○'}</span>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Terms */}
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', lineHeight:'1.6', margin:'0' }}>
                By creating an account, you agree to our{' '}
                <Link href="/terms" style={{ color:'#10b981', textDecoration:'none' }}>Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ color:'#10b981', textDecoration:'none' }}>Privacy Policy</Link>.
              </p>

              {/* Submit */}
              <button id="register-submit-btn" type="submit" className="auth-btn" disabled={loading || !!socialLoading}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p style={{ textAlign:'center', marginTop:'24px', fontSize:'14px', color:'rgba(255,255,255,0.35)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color:'#10b981', textDecoration:'none', fontWeight:'500' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}