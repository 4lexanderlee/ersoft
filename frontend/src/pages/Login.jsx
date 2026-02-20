import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      if (result.success) {
        navigate('/principal');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-end overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />
      {/* Slight overlay to darken background slightly */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Login card — right side */}
      <div className="relative z-10 mr-16 w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-3xl px-10 py-12 shadow-2xl flex flex-col items-center">
          {/* Brand */}
          <h1 className="text-white text-5xl font-extrabold mb-3 tracking-tight">ER-Soft</h1>
          <p className="text-gray-300 text-sm mb-8 text-center">
            Inicia sesión con tus credencial empresarial
          </p>

          {/* Error message */}
          {error && (
            <div className="w-full mb-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl px-4 py-2 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Username field */}
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-transparent border border-gray-500 text-white placeholder-gray-400 text-center rounded-full py-3 px-6 focus:outline-none focus:border-gray-300 transition-colors"
            />

            {/* Password field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border border-gray-500 text-white placeholder-gray-400 text-center rounded-full py-3 px-6 focus:outline-none focus:border-gray-300 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-extrabold text-lg rounded-full py-3 mt-2 hover:bg-gray-200 transition-colors disabled:opacity-60 tracking-wide uppercase"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-gray-400 text-sm mt-6 hover:text-gray-200 cursor-pointer transition-colors">
            ¿Olvidaste tu contraseña?
          </p>

          <div className="mt-8 border-t border-gray-700 pt-4 w-full text-center">
            <p className="text-gray-600 text-xs">
              <span className="hover:text-gray-400 cursor-pointer">Términos de uso</span>
              {'. '}
              <span className="hover:text-gray-400 cursor-pointer">Política de Privacidad</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
