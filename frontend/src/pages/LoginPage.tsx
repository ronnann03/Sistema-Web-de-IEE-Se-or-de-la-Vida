import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import { User, Eye, EyeOff, AlertCircle, Info, CheckCircle } from "lucide-react";
import logo from "../assets/Logo_IEE-removebg-preview.png";
import inicio from "../assets/inicio.png";

const schema = z.object({
  username: z.string().min(1, "Ingresa tu usuario"),
  password: z.string().min(4, "Contraseña inválida"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    setInfoMessage("");
    try {
      await login(data.username, data.password);
      setShowSuccessModal(true);
    } catch {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    }
  };

  const showAlert = (type: "error" | "info", message: string) => {
    if (type === "error") {
      setError(message);
      setInfoMessage("");
    } else {
      setInfoMessage(message);
      setError("");
    }
  };

  return (
    <>
      <div className="flex w-full h-screen bg-white">
        {/* Lado izquierdo: imagen (oculto en móviles) */}
        <div className="hidden lg:block lg:w-1/2 relative bg-gray-100 overflow-hidden">
          <img
            src={inicio}
            alt="Inicio de sesión"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Lado derecho: formulario */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-16 xl:p-24 relative">

          {/* Cabecera + formulario alineados */}
          <div className="max-w-[430px] w-full mx-auto space-y-6 sm:space-y-8">
            <div className="flex items-center gap-3 select-none">
              <span className="font-title font-black text-xl sm:text-2xl tracking-tight text-black">PORTAL DE</span>
              <span className="font-title font-black text-xl sm:text-2xl tracking-tight text-[#0054a6]">ASISTENCIAS</span>
              <img src={logo} alt="Logo IEE" className="h-[60px] w-auto object-contain flex-shrink-0" />
            </div>
            {/* Saludo */}
            <div className="space-y-2">
              <h1 className="text-[34px] sm:text-[40px] font-black text-[#1e293b] leading-tight font-title tracking-tight">¡Hola!</h1>
              <p className="text-sm sm:text-[15px] text-gray-500 font-normal">
                Ingresa tus datos para <span className="font-bold text-gray-800">iniciar sesión</span>.
              </p>
            </div>

            {/* Alertas */}
            {(error || infoMessage) && (
              <div className={`p-4 rounded-md text-sm flex items-start gap-3 transition-all duration-300 ${
                error
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-blue-50 border border-blue-200 text-[#0f2d4a]"
              }`}>
                {error ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <div className="font-medium">{error || infoMessage}</div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Campo: usuario */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-[13px] font-extrabold text-[#1e293b] tracking-wide uppercase sm:normal-case">
                  Codigo de Usuario
                </label>
                <div className="relative">
                  <input
                    {...register("username")}
                    placeholder="Ingresa tu usuario"
                    className="w-full px-4 py-3 border border-gray-300 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-[#0054a6] focus:border-[#0054a6] transition-colors text-slate-800 pr-10 text-[14px] sm:text-[15px]"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-5 h-5 stroke-[1.5]" />
                  </div>
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                )}
                <div className="flex items-start gap-1.5 text-xs sm:text-[12.5px] text-[#0f2d4a] font-semibold leading-relaxed pt-1">
                  <Info className="w-[17px] h-[17px] text-[#0054a6] flex-shrink-0 mt-0.5" />
                  <span>Ejemplo de usuario: D12345 o P12345</span>
                </div>
              </div>

              {/* Campo: contraseña */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-[13px] font-extrabold text-[#1e293b] tracking-wide uppercase sm:normal-case">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-4 py-3 border border-gray-300 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-[#0054a6] focus:border-[#0054a6] transition-colors text-slate-800 pr-10 text-[14px] sm:text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 stroke-[1.5]" /> : <Eye className="w-5 h-5 stroke-[1.5]" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Enlace: restablecer contraseña */}
              <div className="text-right pt-1">
                <button
                  type="button"
                  onClick={() => showAlert("info", "Por favor, ponte en contacto con Soporte TI para restablecer tus credenciales o solicita un cambio desde tu correo institucional.")}
                  className="text-xs sm:text-[13.5px] font-bold text-[#0054a6] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Restablecer contraseña
                </button>
              </div>

              {/* Botón: iniciar sesión */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0054a6] text-white py-3.5 px-4 rounded-[4px] font-bold text-sm sm:text-[15px] transition-all hover:bg-[#003d7a] shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center disabled:opacity-60"
                >
                  {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
                </button>
              </div>

              {/* Enlace: ayuda */}
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => showAlert("info", "Si necesitas asistencia adicional para ingresar, puedes escribir a la mesa de ayuda de soporte tecnológico.")}
                  className="text-xs sm:text-[13.5px] font-bold text-[#0054a6] hover:underline bg-transparent border-none cursor-pointer"
                >
                  ¿Necesitas ayuda?
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 text-center transform scale-95 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-title">Acceso Autorizado</h3>
            <p className="text-gray-600 text-sm mb-6">
              Sesión iniciada correctamente. Redirigiendo a tu panel...
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-[#0054a6] hover:bg-[#003d7a] text-white font-bold py-2.5 px-4 rounded transition-colors text-sm"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
