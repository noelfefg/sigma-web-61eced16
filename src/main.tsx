import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/Home";
import BrowsePage from "./pages/Browse";
import FollowingPage from "./pages/Following";
import WatchPage from "./pages/Watch";
import ChannelPage from "./pages/Channel";
import AuthPage from "./pages/Auth";
import GiftsPage from "./pages/Gifts";
import GoLivePage from "./pages/GoLive";
import NotFound from "./pages/NotFound";
import "./index.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/watch/:username" element={<WatchPage />} />
        <Route path="/channel/:username" element={<ChannelPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/gifts" element={<GiftsPage />} />
        <Route path="/go-live" element={<GoLivePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
