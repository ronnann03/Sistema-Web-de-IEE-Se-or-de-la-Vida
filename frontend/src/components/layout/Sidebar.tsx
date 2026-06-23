import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, LogOut, ClipboardList, BarChart2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import clsx from "clsx";

const nav = [
  { to: "/dashboard", label: "Control del Sistema", icon: LayoutDashboard },
  { to: "/miembros", label: "Miembros", icon: Users },
  { to: "/miembros/nuevo", label: "Nuevo Miembro", icon: UserPlus },
  { to: "/asistencia", label: "Pasar Asistencia", icon: ClipboardList },
  { to: "/reportes", label: "Reportes", icon: BarChart2 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-lg font-bold leading-tight">IEE Señor de la Vida</h1>
        <p className="text-blue-300 text-xs mt-1">Sistema de Personal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-blue-700 text-white font-medium"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="text-xs text-blue-300 mb-3">{user?.nombre}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
