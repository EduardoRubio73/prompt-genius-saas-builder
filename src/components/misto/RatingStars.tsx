interface RatingStarsProps {
  rating: number;
  onChange: (r: number) => void;
  label?: string;
}

export function RatingStars({ rating, onChange, label = "Avaliar:" }: RatingStarsProps) {
  return (
    <div className="misto-rating-row">
      <span className="misto-rating-label">{label}</span>
      <div className="misto-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`misto-star ${n <= rating ? "on" : ""}`}
            onClick={() => onChange(n)}
            type="button"
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
