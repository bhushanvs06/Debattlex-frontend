// src/components/MiniCoach.jsx
export default function MiniCoach({ isLegend = false }) {
  return (
    <div style={{ textAlign: 'center', margin: '30px 0' }}>
      <svg
        width="120"
        height="140"
        viewBox="0 0 110 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: isLegend ? 'legendBounce 0.8s infinite alternate' : 'bob 2.5s infinite ease-in-out',
          filter: isLegend ? 'drop-shadow(0 0 20px #ffd700)' : 'none',
        }}
      >
        {/* Body */}
        <rect x="38" y="55" width="34" height="55" rx="12" fill="#6a1b9a" />
        {/* Head */}
        <circle cx="55" cy="42" r="22" fill="#ffdbac" />
        {/* Eyes */}
        <circle cx="47" cy="37" r="4" fill="#222" />
        <circle cx="63" cy="37" r="4" fill="#222" />
        {/* Smile */}
        <path d="M45 48 Q55 55 65 48" stroke="#222" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Left arm thumbs-up */}
        <line x1="38" y1="68" x2="20" y2="80" stroke="#6a1b9a" strokeWidth="14" strokeLinecap="round" />
        <circle cx="18" cy="78" r="9" fill="#ffdbac" />
        <line x1="15" y1="72" x2="25" y2="62" stroke="#ffdbac" strokeWidth="7" strokeLinecap="round" />
        {/* Sparkles on legend */}
        {isLegend && (
          <>
            <circle cx="85" cy="20" r="6" fill="#ffd700" />
            <circle cx="95" cy="15" r="4" fill="#ffd700" />
            <circle cx="78" cy="35" r="5" fill="#ffd700" />
          </>
        )}
      </svg>
      <p
        style={{
          color: '#ffd700',
          fontSize: '22px',
          fontWeight: 'bold',
          marginTop: '10px',
        }}
      >
        {isLegend
          ? "COACH DEBBY IS SCREAMING WITH JOY! 🎉"
          : "Coach Debby is super proud of you! 🔥"}
      </p>
    </div>
  );
}