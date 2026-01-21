'use client';

export default function ShoppingBagIcon({ className = '', size = 20, color = 'currentColor' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shopping bag body - rectangular, wider at top, tapering toward bottom */}
      <path
        d="M7 9L7 7C7 5.34315 8.34315 4 10 4L14 4C15.6569 4 17 5.34315 17 7L17 9L19 9C19.5523 9 20 9.44772 20 10L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 10C4 9.44772 4.44772 9 5 9L7 9Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left handle - U-shaped extending upward from left edge */}
      <path
        d="M9.5 9C9.5 8.17157 10.1716 7.5 11 7.5C11.8284 7.5 12.5 8.17157 12.5 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right handle - U-shaped extending upward from right edge */}
      <path
        d="M11.5 9C11.5 8.17157 12.1716 7.5 13 7.5C13.8284 7.5 14.5 8.17157 14.5 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
