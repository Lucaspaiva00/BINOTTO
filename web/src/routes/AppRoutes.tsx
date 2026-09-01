import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { GuestRoute } from "./GuestRoute";

import Login from "../pages/Login";
// import Dashboard from "../pages/Dashboard"; // item Dashboard removido do menu, rota comentada abaixo
import UsersList from "../pages/usuarios/UsersList";
import UserNew from "../pages/usuarios/UserNew";
import UserEdit from "../pages/usuarios/UserEdit";
import Financeiro from "../pages/financeiro/Financeiro";
import ServicosList from "../pages/servicos/ServicosList";
import ServicoDetail from "../pages/servicos/ServicoDetail";
import PericiasList from "../pages/pericias/PericiasList";
import PericiaNew from "../pages/pericias/PericiaNew";
import PericiaDetail from "../pages/pericias/PericiaDetail";
import AdministratorsList from "../pages/administradores/AdministratorsList";
import AdministratorNew from "../pages/administradores/AdministratorNew";
import AdministratorEdit from "../pages/administradores/AdministratorEdit";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navigate to="/usuarios" replace />
            </PrivateRoute>
          }
        />

        {/* <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        /> */}

        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <UsersList />
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios/novo"
          element={
            <PrivateRoute>
              <UserNew />
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios/:id"
          element={
            <PrivateRoute>
              <UserEdit />
            </PrivateRoute>
          }
        />

        <Route
          path="/financeiro"
          element={
            <PrivateRoute>
              <Financeiro />
            </PrivateRoute>
          }
        />

        <Route
          path="/servicos"
          element={
            <PrivateRoute>
              <ServicosList />
            </PrivateRoute>
          }
        />

        <Route
          path="/servicos/:id"
          element={
            <PrivateRoute>
              <ServicoDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/pericias"
          element={
            <PrivateRoute>
              <PericiasList />
            </PrivateRoute>
          }
        />

        <Route
          path="/pericias/novo"
          element={
            <PrivateRoute>
              <PericiaNew />
            </PrivateRoute>
          }
        />

        <Route
          path="/pericias/:id"
          element={
            <PrivateRoute>
              <PericiaDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/administradores"
          element={
            <PrivateRoute>
              <AdministratorsList />
            </PrivateRoute>
          }
        />

        <Route
          path="/administradores/novo"
          element={
            <PrivateRoute>
              <AdministratorNew />
            </PrivateRoute>
          }
        />

        <Route
          path="/administradores/:id/editar"
          element={
            <PrivateRoute>
              <AdministratorEdit />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
