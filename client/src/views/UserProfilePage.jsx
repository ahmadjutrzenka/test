import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../constants/url";
import MediaCard from "../components/MediaCard";
import { generateTasteDNA } from "../features/tasteDna/tasteDnaSlice";

export default function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: me } = useSelector((s) => s.auth);
  const isOwnProfile = me?.username === username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("collections");

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/users/${username}`)
      .then((r) => {
        setProfile(r.data);
        setLoading(false);
      })
      .catch(() => {
        setError("User not found.");
        setLoading(false);
      });
  }, [username]);

  if (loading) return <p className="page-loading">Loading profile…</p>;
  if (error) return <p className="page-error">{error}</p>;
  if (!profile) return null;

  const { user, stats, favorites, tasteDNA, collections } = profile;
  const reviews = collections.flatMap((c) =>
    c.Review ? [{ ...c.Review, collection: c }] : [],
  );

  return (
    <div className="profile-page">
      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user.username}</h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <p className="profile-joined">
            Joined{" "}
            {new Date(user.joinedSince).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="profile-stats">
            <span className="profile-stat">
              <span className="anime-label">{stats.anime}</span> anime
            </span>
            <span className="profile-stat">
              <span className="manga-label">{stats.manga}</span> manga
            </span>
            <span className="profile-stat">
              <span className="game-label">{stats.game}</span> games
            </span>
          </div>
          {isOwnProfile && (
            <button
              className="btn btn-ghost"
              style={{ marginTop: 4, alignSelf: "flex-start" }}
              onClick={() => navigate("/profile")}
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <section className="profile-section">
          <h2 className="profile-section-title">★ Favorites</h2>
          <div className="favorites-grid">
            {favorites.map((f) => (
              <Link
                to={`/media/${f.mediaType}/${f.externalId}`}
                key={f.id}
                className="favorite-card"
              >
                <img
                  src={
                    f.coverUrl ||
                    `https://placehold.co/80x114/1e1e2a/7c7a8a?text=${f.mediaType}`
                  }
                  alt={f.title}
                />
                <span className="favorite-title">{f.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Taste DNA */}
      {tasteDNA && (
        <section className="profile-section">
          <h2 className="profile-section-title">Taste DNA</h2>
          <div className="taste-dna-card">
            <p>{tasteDNA.content}</p>
            <span className="taste-dna-date">
              Generated {new Date(tasteDNA.generatedAt).toLocaleDateString()}
            </span>
          </div>
        </section>
      )}

      {/* Tabs: Collections / Reviews */}
      <section className="profile-section">
        <div className="profile-tabs">
          <button
            className={`profile-tab ${tab === "collections" ? "active" : ""}`}
            onClick={() => setTab("collections")}
          >
            Collections ({collections.length})
          </button>
          <button
            className={`profile-tab ${tab === "reviews" ? "active" : ""}`}
            onClick={() => setTab("reviews")}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {tab === "collections" && (
          <div className="card-grid" style={{ marginTop: 14 }}>
            {collections.map((c) => (
              <MediaCard
                key={c.id}
                id={c.id}
                title={c.title}
                coverUrl={c.coverUrl}
                mediaType={c.mediaType}
                status={c.status}
                score={c.score}
                isFavorite={c.isFavorite}
                externalId={c.externalId}
              />
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="profile-reviews" style={{ marginTop: 14 }}>
            {reviews.length === 0 ? (
              <p className="page-empty">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <Link
                  to={`/media/${r.collection.mediaType}/${r.collection.externalId}`}
                  key={r.id}
                  className="profile-review-item"
                >
                  <img
                    src={
                      r.collection.coverUrl ||
                      `https://placehold.co/40x58/1e1e2a/7c7a8a?text=?`
                    }
                    alt={r.collection.title}
                    className="profile-review-cover"
                  />
                  <div className="profile-review-body">
                    <p className="profile-review-title">
                      {r.collection.title}
                      <span
                        className={`badge badge-${r.collection.mediaType}`}
                        style={{ marginLeft: 8 }}
                      >
                        {r.collection.mediaType}
                      </span>
                    </p>
                    {r.rating != null && (
                      <span className="review-rating">★ {r.rating}</span>
                    )}
                    {r.content && (
                      <p className="profile-review-content">{r.content}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
