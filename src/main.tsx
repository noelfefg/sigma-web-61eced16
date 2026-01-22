import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.tsx";
import ProfilePage from "./pages/Profile";
import NotFound from "./pages/NotFound";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/profile/:handle" element={<ProfilePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>,
);
