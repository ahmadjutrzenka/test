import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { fetchCollections } from "../features/collection/collectionSlice";
import { fetchRecentReviews } from "../features/review/reviewSlice";
import MediaCard from "../components/MediaCard";
import ReviewCarousel from "../components/ReviewCarousel.jsx";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.collection);
  const { reviews } = useSelector((s) => s.review);

  useEffect(() => {
    dispatch(fetchCollections());
    dispatch(fetchRecentReviews());
  }, [dispatch]);

  const ongoing = items.filter((c) => c.status === "ongoing");
  const recent = [...items]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);
  const stats = {
    anime: items.filter((c) => c.mediaType === "anime").length,
    manga: items.filter((c) => c.mediaType === "manga").length,
    game: items.filter((c) => c.mediaType === "game").length,
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="dashboard">
      {/* Hero */}
      <section className="dashboard-hero">
        <div>
          <p className="greeting">
            {greeting}, {user?.username}
          </p>
          <h1>Your collection, your vibe.</h1>
          {user?.TasteDNA && (
            <p className="dna-excerpt">
              "{user.TasteDNA.content.slice(0, 180)}..."
            </p>
          )}
        </div>
        <div className="hero-ctas">
          <Link to="/vibe-match" className="btn-primary">
            Vibe Check
          </Link>
          <Link to="/collections" className="btn-secondary">
            Title match
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-label anime-label">Anime</span>
          <span className="stat-num">{stats.anime}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label manga-label">Manga</span>
          <span className="stat-num">{stats.manga}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label game-label">Game</span>
          <span className="stat-num">{stats.game}</span>
        </div>
      </section>

      {/* Continue */}
      {ongoing.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Continue</h2>
          </div>
          <div className="card-grid">
            {ongoing.slice(0, 4).map((c) => (
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
        </section>
      )}

      {/* Discover CTA */}
      <section className="discover-ctas">
        <Link to="/vibe-match" className="cta-card">
          <h3>Vibe Match</h3>
          <p>Pick titles, AI finds what to watch, read, or play next.</p>
        </Link>
        <Link to="/collections?mode=title-match" className="cta-card">
          <h3>Title Match</h3>
          <p>Choose one title, find its counterparts across all three media.</p>
        </Link>
      </section>

      {/* Recently added */}
      <section className="section">
        <div className="section-header">
          <h2>Recently added</h2>
          <Link to="/collections">See all</Link>
        </div>
        <div className="card-grid">
          {recent.map((c) => (
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
      </section>

      {/* Reviews carousel */}
      <section className="section">
        <h2>Recent reviews</h2>
        <ReviewCarousel reviews={reviews} />
      </section>
    </div>
  );
}
