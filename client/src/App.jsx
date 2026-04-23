import { Routes, Route, Navigate } from "react-router";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./views/LoginPage";
import RegisterPage from "./views/RegisterPage";
import OAuthCallback from "./views/OAuthCallback";
import DashboardPage from "./views/DashboardPage";
import CollectionsPage from "./views/CollectionsPage";
import SearchPage from "./views/SearchPage";
import VibeMatchPage from "./views/VibeMatchPage";
import TitleMatchPage from "./views/TitleMatchPage";
import MediaDetailPage from "./views/MediaDetailPage";
import UserProfilePage from "./views/UserProfilePage";
import ProfilePage from "./views/ProfilePage";

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/vibe-match" element={<VibeMatchPage />} />
        <Route path="/title-match/:id" element={<TitleMatchPage />} />
        <Route path="/media/:type/:externalId" element={<MediaDetailPage />} />
        <Route path="/users/:username" element={<UserProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
