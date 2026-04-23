import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import axios from "axios";
import { fetchProfile } from "../features/auth/authSlice";
import {
  fetchCollections,
  updateCollection,
} from "../features/collection/collectionSlice";
import { generateTasteDNA } from "../features/tasteDna/tasteDnaSlice";
import { BASE_URL } from "../constants/url";
import "./UserProfilePage.css";
import "./ProfilePage.css";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.collection);
  const { content: dnaContent, loading: dnaLoading } = useSelector(
    (s) => s.tasteDna,
  );

  const [bio, setBio] = useState(user?.bio || "");
  const [bioSaving, setBioSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef(null);

  const token = localStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const handleBioSave = async (e) => {
    e.preventDefault();
    setBioSaving(true);
    try {
      await axios.patch(`${BASE_URL}/auth/profile`, { bio }, { headers });
      dispatch(fetchProfile());
      setFeedback("Bio updated!");
    } catch {
      setFeedback("Failed to update bio.");
    } finally {
      setBioSaving(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await axios.patch(`${BASE_URL}/auth/profile/avatar`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      dispatch(fetchProfile());
      setFeedback("Avatar updated!");
    } catch {
      setFeedback("Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  const favorites = items.filter((c) => c.isFavorite);
  const nonFavorites = items.filter((c) => !c.isFavorite);

  const handleToggleFavorite = (item) => {
    dispatch(
      updateCollection(item.id, {
        isFavorite: !item.isFavorite,
        status: item.status,
      }),
    );
  };

  const handleGenerateDNA = () => dispatch(generateTasteDNA());

  return (
    <div className="profile-page">
      <div className="settings-header">
        <h1 className="vibe-title">Profile settings</h1>
        <Link to={`/users/${user?.username}`} className="btn btn-ghost">
          View public profile
        </Link>
      </div>

      {feedback && <div className="feedback-toast">{feedback}</div>}

      {/* Avatar */}
      <section className="settings-section">
        <h2 className="settings-section-title">Avatar</h2>
        <div className="avatar-row">
          <div className="profile-avatar-wrap">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.username}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => fileRef.current.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? "Uploading…" : "Change avatar"}
            </button>
            <p className="settings-hint">JPG, PNG or WEBP, max 5MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>
      </section>

      {/* Bio */}
      <section className="settings-section">
        <h2 className="settings-section-title">Bio</h2>
        <form onSubmit={handleBioSave} className="settings-form">
          <textarea
            className="input textarea"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about your taste…"
            maxLength={300}
          />
          <div className="settings-form-footer">
            <span className="settings-hint">{bio.length}/300</span>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={bioSaving}
            >
              {bioSaving ? "Saving…" : "Save bio"}
            </button>
          </div>
        </form>
      </section>

      {/* Taste DNA */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Taste DNA</h2>
          <button
            className="btn btn-secondary"
            onClick={handleGenerateDNA}
            disabled={dnaLoading || items.length === 0}
          >
            {dnaLoading
              ? "Generating…"
              : dnaContent
                ? "Regenerate"
                : "Generate"}
          </button>
        </div>
        {dnaContent ? (
          <div className="taste-dna-card">
            <p>{dnaContent}</p>
          </div>
        ) : (
          <p className="settings-hint">
            {items.length === 0
              ? "Add titles to your collection first."
              : "Generate a personal taste profile based on your collection."}
          </p>
        )}
      </section>

      {/* Favorites manager */}
      <section className="settings-section">
        <h2 className="settings-section-title">
          Favorites ({favorites.length}/5)
        </h2>
        <p className="settings-hint">
          Up to 5 titles shown on your public profile.
        </p>

        {favorites.length > 0 && (
          <div className="favorites-manager">
            <p className="settings-label">Current favorites</p>
            <div className="favorites-grid">
              {favorites.map((c) => (
                <div key={c.id} className="favorite-manage-card">
                  <img
                    src={
                      c.coverUrl ||
                      `https://placehold.co/80x114/1e1e2a/7c7a8a?text=?`
                    }
                    alt={c.title}
                  />
                  <span className="favorite-title">{c.title}</span>
                  <button
                    className="btn btn-danger favorite-remove-btn"
                    onClick={() => handleToggleFavorite(c)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {nonFavorites.length > 0 && favorites.length < 5 && (
          <div className="favorites-manager" style={{ marginTop: 16 }}>
            <p className="settings-label">Add from your collection</p>
            <div className="add-favorites-grid">
              {nonFavorites.slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  className="add-favorite-item"
                  onClick={() => handleToggleFavorite(c)}
                >
                  <img
                    src={
                      c.coverUrl ||
                      `https://placehold.co/48x68/1e1e2a/7c7a8a?text=?`
                    }
                    alt={c.title}
                  />
                  <span>{c.title}</span>
                  <span className="add-favorite-plus">+</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
