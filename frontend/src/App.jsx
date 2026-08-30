import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import QuizGuard from "./pages/QuizGuard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quiz from "./pages/Quiz";
import Feed from "./pages/Feed";
import NewPost from "./pages/NewPost";
import PostDetail from "./pages/PostDetail";
import Salas from "./pages/Salas";
import Usuarios from "./pages/Usuarios";
import Perfil from "./pages/Perfil";
import Messages from "./pages/Messages";
import Configuracoes from "./pages/Configuracoes";
import Admin from "./pages/Admin";
import Ranking from "./pages/Ranking";
import PerfilPublico from "./pages/PerfilPublico";
import Vagas from "./pages/Vagas";

const P = ({ children }) => <PrivateRoute>{children}</PrivateRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <QuizGuard>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route
              path="/quiz"
              element={
                <P>
                  <Quiz />
                </P>
              }
            />
            <Route
              path="/feed"
              element={
                <P>
                  <Feed />
                </P>
              }
            />
            <Route
              path="/novo-post"
              element={
                <P>
                  <NewPost />
                </P>
              }
            />
            <Route
              path="/posts/:id"
              element={
                <P>
                  <PostDetail />
                </P>
              }
            />
            <Route
              path="/salas"
              element={
                <P>
                  <Salas />
                </P>
              }
            />
            <Route
              path="/usuarios"
              element={
                <P>
                  <Usuarios />
                </P>
              }
            />
            <Route
              path="/usuarios/:id"
              element={
                <P>
                  <PerfilPublico />
                </P>
              }
            />
            <Route
              path="/perfil"
              element={
                <P>
                  <Perfil />
                </P>
              }
            />
            <Route
              path="/mensagens"
              element={
                <P>
                  <Messages />
                </P>
              }
            />
            <Route
              path="/mensagens/:conversationId"
              element={
                <P>
                  <Messages />
                </P>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <P>
                  <Configuracoes />
                </P>
              }
            />
            <Route
              path="/admin"
              element={
                <P>
                  <Admin />
                </P>
              }
            />
            <Route
              path="/ranking"
              element={
                <P>
                  <Ranking />
                </P>
              }
            />
            <Route
              path="/vagas"
              element={
                <P>
                  <Vagas />
                </P>
              }
            />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </QuizGuard>
      </BrowserRouter>
    </AuthProvider>
  );
}
