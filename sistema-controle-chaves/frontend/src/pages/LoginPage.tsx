import { useState, FormEvent } from 'react';
import { AlertCircle, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoAeb from '../images/logoaeb.png';
import loginImage from '../images/login.png';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ username, password });
    } catch {
      setError('Usuário ou senha inválidos. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-[#f6f6f8]">
      {/* Lado Esquerdo: Imagem */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img
          alt="Imagem de login"
          className="absolute inset-0 h-full w-full object-cover"
          src={loginImage}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-20"></div>
      </div>

      {/* Lado Direito: Formulário de Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Cabeçalho / Logo AEB */}
          <div className="flex justify-center mb-4">
            {/* Logo da AEB */}
            <img
              alt="AEB Logo"
              className="h-24 w-auto object-contain"
              src={logoAeb}
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              AEB Controle de Chaves
            </h2>
            <p className="text-slate-500">
              Acesse sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Alerta de Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Input E-mail / Usuário */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                E-mail ou Usuário
              </label>
              <div className="relative group">
                <User
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#135bec] transition-colors"
                />
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#135bec] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Senha
              </label>
              <div className="relative group">
                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#135bec] transition-colors"
                />
                <input
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#135bec] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Ações Extras */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  className="w-5 h-5 rounded border-slate-300 text-[#135bec] focus:ring-[#135bec] transition-all cursor-pointer"
                  type="checkbox"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  Lembrar de mim
                </span>
              </label>
              <a className="text-sm font-semibold text-[#135bec] hover:underline transition-all" href="https://citsmart.aeb.gov.br/">
                Esqueceu a senha?
              </a>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#135bec] hover:bg-blue-700 disabled:bg-blue-400 disabled:transform-none text-white font-bold py-4 rounded-xl shadow-lg shadow-[#135bec]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          {/* Rodapé */}
          <footer className="mt-10 pt-8 border-t border-slate-200">
            <div className="flex flex-col gap-6 text-sm">

              {/* Institucional */}
              <div className="text-center text-slate-500">
                <p className="font-semibold text-slate-600">
                  Sistema de Controle de Chaves
                </p>
                <p>
                  Agência Espacial Brasileira – CTI © 2026
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}