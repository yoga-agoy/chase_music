import React, { useEffect, useRef } from 'react';

export default function Equalizer({ isPlaying, barCount = 18, colorTheme = 'mixed' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const heightsRef = useRef(Array(barCount).fill(5));
  const targetsRef = useRef(Array(barCount).fill(5));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const spacing = 4;
      const barWidth = (width - spacing * (barCount - 1)) / barCount;

      // Update and draw each bar
      for (let i = 0; i < barCount; i++) {
        // Calculate new target height
        if (isPlaying) {
          if (Math.random() < 0.15 || targetsRef.current[i] === heightsRef.current[i]) {
            targetsRef.current[i] = Math.random() * (height - 8) + 8;
          }
        } else {
          targetsRef.current[i] = 4; // Flatline when paused
        }

        // Interpolate current height towards target
        const diff = targetsRef.current[i] - heightsRef.current[i];
        heightsRef.current[i] += diff * 0.15; // interpolation speed

        const barHeight = heightsRef.current[i];
        const x = i * (barWidth + spacing);
        const y = height - barHeight;

        // Create neon gradient
        const gradient = ctx.createLinearGradient(x, y, x, height);
        if (colorTheme === 'primary') {
          gradient.addColorStop(0, '#ff2e93'); // Neon Pink
          gradient.addColorStop(1, '#9f14ff'); // Violet
        } else if (colorTheme === 'secondary') {
          gradient.addColorStop(0, '#00f6ff'); // Neon Cyan
          gradient.addColorStop(1, '#9f14ff'); // Violet
        } else {
          // Alternating themes
          if (i % 2 === 0) {
            gradient.addColorStop(0, '#ff2e93');
            gradient.addColorStop(1, '#9f14ff');
          } else {
            gradient.addColorStop(0, '#00f6ff');
            gradient.addColorStop(1, '#1a103a');
          }
        }

        // Draw glowing bar
        ctx.fillStyle = gradient;
        
        // Glow effect
        ctx.shadowBlur = isPlaying ? 10 : 0;
        ctx.shadowColor = i % 2 === 0 ? '#ff2e93' : '#00f6ff';

        // Draw rounded rectangle
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      // Reset shadow for other drawings
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, barCount, colorTheme]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', display: 'block', maxHeight: '120px' }} 
    />
  );
}
