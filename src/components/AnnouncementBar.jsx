'use client';

import { useState, useEffect } from 'react';

// Default announcement slides - can be customized
const defaultSlides = [
  { 
    text: '⚡ Wholesale Prices are LIVE — Save up to ₹800+ on your order*', 
    link: 'https://atlabeauty.com/pages/the-archive',
    isFullLink: true
  },
  {
    text: 'Not sure where to start? — ',
    link: '',
    linkText: 'Build your custom routine in 60 seconds.',
    isFullLink: false
  },
  {
    text: 'Expertly paired for better results — ',
    link: 'https://atlabeauty.com/pages/curated-sets',
    linkText: 'Explore Curated Sets',
    isFullLink: false
  }
];

export default function AnnouncementBar({ slides = defaultSlides }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;

  // Multiple slides - use carousel
  return (
    <div className="atla-announcement-bar" id="AtlaAnnouncementBar">
      <div className="atla-announcement-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`atla-announcement-slide ${index === activeIndex ? 'active' : ''}`}
          >
            {slide.isFullLink && slide.link ? (
              // Full text is a link
              <a href={slide.link} className="atla-promo-link">
                {slide.text}
              </a>
            ) : slide.linkText ? (
              // Text with inline link
              <>
                {slide.text}
                <a href={slide.link || '#'} className="atla-promo-link">
                  {slide.linkText}
                </a>
              </>
            ) : (
              // Plain text
              <span>{slide.text}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
