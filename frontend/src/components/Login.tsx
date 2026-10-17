import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(); 
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0F172A' }}>
      <div className="card border-0 shadow-lg p-4" style={{ backgroundColor: '#131B2E', width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3" style={{ width: '50px', height: '50px', backgroundColor: '#10B981' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 15h10l1 7H6l1-7z"></path>
              <path d="M12 15V8"></path>
              <path d="M12 11C10 9 8 9.5 7 11C6.5 8 8 6 12 8"></path>
              <path d="M12 11C14 9 16 9.5 17 11C17.5 8 16 6 12 8"></path>
            </svg>
          </div>
          <h4 className="fw-bold text-white mb-1">AgroIoT</h4>
          <p className="small mb-0" style={{ color: '#94A3B8' }}>Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-white small font-medium">Correo electrónico</label>
            <input
              type="email"
              required
              className="form-control border-0 text-white shadow-none py-2 px-3 custom-login-input"
              style={{ backgroundColor: '#1E293B', fontSize: '14px' }}
              placeholder="admin@agroiot.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-white small font-medium">Contraseña</label>
            <input
              type="password"
              required
              className="form-control border-0 text-white shadow-none py-2 px-3 custom-login-input"
              style={{ backgroundColor: '#1E293B', fontSize: '14px' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 fw-bold py-2.5 rounded-3 text-dark border-0"
            style={{ backgroundColor: '#10B981', fontSize: '14px' }}
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};