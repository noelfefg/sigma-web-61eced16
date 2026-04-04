import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import FeedbackPage from "./pages/Feedback";
import RankingsPage from "./pages/Rankings";
import CreatorStudioPage from "./pages/CreatorStudio";
import StorePage from "./pages/Store";
import ChatRoomPage from "./pages/ChatRoom";
import FriendsPage from "./pages/Friends";
import SettingsPage from "./pages/Settings";
import ReportPage from "./pages/Report";
import ProfilePage from "./pages/Profile";
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
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/you" element={<YouPage />} />
        <Route path="/shorts" element={<ShortsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/camera" element={<SnapCameraPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/studio" element={<CreatorStudioPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/chat" element={<ChatRoomPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
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
