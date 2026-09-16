import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { GuestRoute } from "./GuestRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UsersList from "../pages/usuarios/UsersList";
import UserNew from "../pages/usuarios/UserNew";
import UserEdit from "../pages/usuarios/UserEdit";
import Financeiro from "../pages/financeiro/Financeiro";
import ServicosList from "../pages/servicos/ServicosList";
import ServicoNew from "../pages/servicos/ServicoNew";
import ServicoDetail from "../pages/servicos/ServicoDetail";
import PericiasList from "../pages/pericias/PericiasList";
import PericiaNew from "../pages/pericias/PericiaNew";
import PericiaDetail from "../pages/pericias/PericiaDetail";
import PericiaEdit from "../pages/pericias/PericiaEdit";
import AdministratorsList from "../pages/administradores/AdministratorsList";
import AdministratorNew from "../pages/administradores/AdministratorNew";
import AdministratorEdit from "../pages/administradores/AdministratorEdit";
import Settings from "../pages/Settings";

const protectedPage = (element: ReactNode) => <PrivateRoute>{element}</PrivateRoute>;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/" element={protectedPage(<Navigate to="/dashboard" replace />)} />
        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
        <Route path="/usuarios" element={protectedPage(<UsersList />)} />
        <Route path="/usuarios/novo" element={protectedPage(<UserNew />)} />
        <Route path="/usuarios/:id" element={protectedPage(<UserEdit />)} />
        <Route path="/financeiro" element={protectedPage(<Financeiro />)} />
        <Route path="/servicos" element={protectedPage(<ServicosList />)} />
        <Route path="/servicos/novo" element={protectedPage(<ServicoNew />)} />
        <Route path="/servicos/:id" element={protectedPage(<ServicoDetail />)} />
        <Route path="/pericias" element={protectedPage(<PericiasList />)} />
        <Route path="/pericias/novo" element={protectedPage(<PericiaNew />)} />
        <Route path="/pericias/:id/editar" element={protectedPage(<PericiaEdit />)} />
        <Route path="/pericias/:id" element={protectedPage(<PericiaDetail />)} />
        <Route path="/administradores" element={protectedPage(<AdministratorsList />)} />
        <Route path="/administradores/novo" element={protectedPage(<AdministratorNew />)} />
        <Route path="/administradores/:id/editar" element={protectedPage(<AdministratorEdit />)} />
        <Route path="/configuracoes" element={protectedPage(<Settings />)} />
      </Routes>
    </BrowserRouter>
  );
}
