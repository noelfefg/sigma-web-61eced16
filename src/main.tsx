import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CursorProvider } from "@/components/CursorProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import FeedPage from "./pages/Feed";
import BrowsePage from "./pages/Browse";
import FollowingPage from "./pages/Following";
import WatchPage from "./pages/Watch";
import ChannelPage from "./pages/Channel";
import AuthPage from "./pages/Auth";
import GoLivePage from "./pages/GoLive";
import YouPage from "./pages/You";
import MessagesPage from "./pages/Messages";
import FeedbackPage from "./pages/Feedback";
import SettingsPage from "./pages/Settings";
import ProfilePage from "./pages/Profile";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import "./index.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/watch/:username" element={<WatchPage />} />
        <Route path="/channel/:username" element={<ChannelPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/go-live" element={<RequireAuth><GoLivePage /></RequireAuth>} />
        <Route path="/you" element={<RequireAuth><YouPage /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <CursorProvider />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </BrowserRouter>,
);
