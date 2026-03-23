import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import SplashScreen from "./pages/Splash";
import HomePage from "./pages/Home";
import BrowsePage from "./pages/Browse";
import FollowingPage from "./pages/Following";
import WatchPage from "./pages/Watch";
import ChannelPage from "./pages/Channel";
import AuthPage from "./pages/Auth";
import GiftsPage from "./pages/Gifts";
import GoLivePage from "./pages/GoLive";
import FeedPage from "./pages/Feed";
import YouPage from "./pages/You";
import ShortsPage from "./pages/Shorts";
import CommunityPage from "./pages/Community";
import MessagesPage from "./pages/Messages";
import SnapCameraPage from "./pages/SnapCamera";
import NotFound from "./pages/NotFound";
import SettingsPage from "./pages/Settings";
import FriendsPage from "./pages/Friends";
import RankingsPage from "./pages/Rankings";
import CreatorStudioPage from "./pages/CreatorStudio";
import FeedbackPage from "./pages/Feedback";
import AdminPage from "./pages/Admin";
import "./index.css";

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const onDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={onDone} />}
      <div style={{ visibility: splashDone ? 'visible' : 'hidden', height: splashDone ? 'auto' : '100vh' }}>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/browse"    element={<BrowsePage />} />
          <Route path="/following" element={<FollowingPage />} />
          <Route path="/watch/:username" element={<WatchPage />} />
          <Route path="/channel/:username" element={<ChannelPage />} />
          <Route path="/auth"      element={<AuthPage />} />
          <Route path="/gifts"     element={<GiftsPage />} />
          <Route path="/go-live"   element={<GoLivePage />} />
          <Route path="/feed"      element={<FeedPage />} />
          <Route path="/you"       element={<YouPage />} />
          <Route path="/shorts"    element={<ShortsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/messages"  element={<MessagesPage />} />
          <Route path="/camera"    element={<SnapCameraPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="/friends"   element={<FriendsPage />} />
          <Route path="/rankings"  element={<RankingsPage />} />
          <Route path="/studio"    element={<CreatorStudioPage />} />
          <Route path="/feedback"  element={<FeedbackPage />} />
          <Route path="/admin"     element={<AdminPage />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </>
  );
}

const el = document.getElementById("root");
if (!el) throw new Error("#root element missing from index.html");

createRoot(el).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <App />
    </ThemeProvider>
  </BrowserRouter>
);
