/*
 * Auth lamp interaction inspired by an open-source design from Ilmah Code Hub.
 * Ilmah Code Hub: https://nicegram.app/hub/channel/IlmahCodeSpace
 * Adapted for Plutus by Two Sicilies with custom layout, styling, and form logic.
 */

"use client";

import Link from "next/link";
import { Great_Vibes } from "next/font/google";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

const logoFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

type RenaissanceAuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  switchText: string;
  switchHref: string;
  switchLabel: string;
  children: ReactNode;
};

export default function RenaissanceAuthShell({
  eyebrow,
  title,
  subtitle,
  switchText,
  switchHref,
  switchLabel,
  children,
}: RenaissanceAuthShellProps) {
  const [isOn, setIsOn] = useState(false);

  const shellRef = useRef<HTMLElement | null>(null);
  const loginFormRef = useRef<HTMLDivElement | null>(null);
  const cordBeadRef = useRef<SVGCircleElement | null>(null);
  const cordLineRef = useRef<SVGLineElement | null>(null);
  const hitAreaRef = useRef<SVGCircleElement | null>(null);
  const isOnRef = useRef(false);

  useEffect(() => {
    gsap.registerPlugin(Draggable);

    const shell = shellRef.current;
    const loginForm = loginFormRef.current;
    const cordBead = cordBeadRef.current;
    const cordLine = cordLineRef.current;
    const hitArea = hitAreaRef.current;

    if (!shell || !loginForm || !cordBead || !cordLine || !hitArea) {
      return;
    }

    const clickSound = new Audio("https://assets.codepen.io/605876/click.mp3");

    function toggleLamp() {
      if (!shell || !loginForm) return;

      isOnRef.current = !isOnRef.current;
      setIsOn(isOnRef.current);

      clickSound.currentTime = 0;
      void clickSound.play().catch(() => {
        // Browser may block sound before user interaction. Ignore safely.
      });

      shell.setAttribute("data-on", String(isOnRef.current));
      shell.style.setProperty("--on", isOnRef.current ? "1" : "0");

      if (isOnRef.current) {
        loginForm.classList.add("active");

        gsap.to(shell, {
          backgroundColor: "#1c1f24",
          duration: 0.6,
        });
      } else {
        loginForm.classList.remove("active");

        gsap.to(shell, {
          backgroundColor: "#121417",
          duration: 0.6,
        });
      }
    }

    const draggableInstances = Draggable.create(hitArea, {
      type: "y",
      bounds: {
        minY: 0,
        maxY: 60,
      },

      onDrag: function () {
        gsap.set(cordBead, {
          y: this.y,
        });

        gsap.set(cordLine, {
          attr: {
            y2: 180 + this.y,
          },
        });
      },

      onRelease: function () {
        if (this.y > 30) {
          toggleLamp();
        }

        gsap.to([cordBead, hitArea], {
          y: 0,
          duration: 0.5,
          ease: "back.out(2.5)",
        });

        gsap.to(cordLine, {
          attr: {
            y2: 180,
          },
          duration: 0.5,
          ease: "back.out(2.5)",
        });
      },
    });

    return () => {
      draggableInstances.forEach((instance) => instance.kill());
    };
  }, []);

  return (
    <main
      ref={shellRef}
      data-on={isOn}
      className="auth-shell"
    >
      <div className="container">
        <div className="lamp-wrapper">
          <svg
            className="lamp-svg"
            viewBox="0 0 200 300"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <ellipse className="inner-glow" cx="100" cy="110" rx="60" ry="30" />

            <rect
              className="lamp-base"
              x="92"
              y="100"
              width="16"
              height="160"
              rx="8"
            />

            <rect
              className="lamp-base"
              x="60"
              y="250"
              width="80"
              height="12"
              rx="6"
            />

            <g className="pull-cord">
              <line
                ref={cordLineRef}
                className="cord-line"
                x1="130"
                y1="110"
                x2="130"
                y2="180"
              />

              <circle
                ref={cordBeadRef}
                className="cord-bead"
                cx="130"
                cy="190"
                r="6"
              />

              <circle
                ref={hitAreaRef}
                className="cord-hit"
                cx="130"
                cy="190"
                r="25"
                fill="transparent"
              />
            </g>

            <g className="lamp-shade-group">
              <path
                className="lamp-shade"
                d="M54 64 C 66 55, 134 55, 146 64 L168 122 C 151 134, 49 134, 32 122 Z"
              />
              <path
                className="lamp-shade-rim"
                d="M54 64 C 68 55, 132 55, 146 64 C 134 73, 66 73, 54 64 Z"
              />
              <path
                className="lamp-shade-bottom-rim"
                d="M32 122 C 50 132, 150 132, 168 122 C 155 139, 45 139, 32 122 Z"
              />
              <path className="lamp-pleat" d="M67 67 L49 123" />
              <path className="lamp-pleat" d="M80 65 L72 126" />
              <path className="lamp-pleat" d="M94 64 L94 128" />
              <path className="lamp-pleat" d="M106 64 L106 128" />
              <path className="lamp-pleat" d="M120 65 L128 126" />
              <path className="lamp-pleat" d="M133 67 L151 123" />
            </g>
          </svg>

          <p className="lamp-hint">Pull the cord to enter</p>
        </div>

        <div ref={loginFormRef} className="login-form">
          <Link href="/" className={`${logoFont.className} brand-link`}>
            Plutus
          </Link>

          <p className="auth-eyebrow">{eyebrow}</p>

          <h2>{title}</h2>

          <p className="auth-subtitle">{subtitle}</p>

          <div className="auth-form-content">{children}</div>

          <p className="auth-switch">
            {switchText}{" "}
            <Link href={switchHref} className="auth-switch-link">
              {switchLabel}
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-shell {
          --bg-color: #121417;
          --lamp-matte: #e8e2d9;
          --lamp-shade: #f5f0e6;
          --lamp-base: #d1ccc2;
          --glow-color: rgba(255, 214, 110, 0.3);
          --accent-color: #d4a373;
          --on: 0;
          --transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);

          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          place-items: center;
          background: var(--bg-color);
          margin: 0;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          overflow: hidden;
          transition: background var(--transition);
          position: relative;
        }

        .auth-shell::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at 50% 40%,
            var(--glow-color),
            transparent 70%
          );
          opacity: var(--on);
          transition: opacity var(--transition);
          pointer-events: none;
        }

        .container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(1.5rem, 3vw, 3rem);
          width: min(100%, 1040px); 
          padding: 3rem;
          z-index: 1;
          flex-wrap: wrap;
          min-height: 720px;
        }

        .lamp-wrapper {
          flex:1;
          position: relative;
          min-width: 320px;
          height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .lamp-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .lamp-shade {
          fill: rgba(245, 219, 163, 0.92);
          transition: fill var(--transition);
          stroke: rgba(126, 91, 43, 0.58);
          stroke-width: 1.8;
          filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.2));
        }

        [data-on="true"] .lamp-shade {
          fill: rgba(255, 226, 166, 0.96);
          filter: drop-shadow(0 0 34px rgba(255, 206, 112, 0.45));
        }

        .lamp-shade-rim,
        .lamp-shade-bottom-rim {
          fill: rgba(172, 122, 55, 0.82);
          stroke: rgba(95, 66, 32, 0.45);
          stroke-width: 1.2;
        }

        .lamp-shade-bottom-rim {
          fill: rgba(145, 101, 49, 0.86);
        }

        .lamp-pleat {
          fill: none;
          stroke: rgba(181, 125, 52, 0.34);
          stroke-width: 3;
          stroke-linecap: round;
        }

        [data-on="true"] .lamp-pleat {
          stroke: rgba(255, 190, 90, 0.45);
        }

        .lamp-base {
          fill: var(--lamp-base);
        }

        .inner-glow {
          fill: #ffdb8a;
          opacity: 0;
          transition: opacity var(--transition);
          filter: blur(15px);
        }

        [data-on="true"] .inner-glow {
          opacity: 0.6;
        }

        .cord-line {
          stroke: #555;
          stroke-width: 2;
        }

        .cord-bead {
          fill: var(--accent-color);
        }

        .cord-hit {
          cursor: pointer;
        }

        .lamp-hint {
          margin: -1.5rem 0 0;
          color: rgba(245, 219, 163, 0.92);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-shadow:
            0 0 12px rgba(255, 214, 110, 0.65),
            0 0 28px rgba(255, 214, 110, 0.28);
          transition:
            opacity var(--transition),
            transform var(--transition);
          animation: lampHintPulse 1.8s ease-in-out infinite;
        }

        [data-on="true"] .lamp-hint {
          opacity: 0;
          transform: translateY(0.5rem);
          pointer-events: none;
          animation: none;
        }

        @keyframes lampHintPulse {
          0%,
          100% {
            opacity: 0.68;
          }
          50% {
            opacity: 1;
          }
        }

        .login-form {
          flex: 0 0 460px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 2.5rem;
          border-radius: 30px;
          width: min(460px, 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transform: translateY(30px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-height: min(860px, calc(100vh - 4rem));
          overflow-y: auto;
        }

        .login-form.active {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }

        :global(.brand-link) {
          display: block;
          margin-bottom: 0.6rem;
          text-align: center;
          color: white;
          text-decoration: none;
          font-size: 3rem;
          font-weight: 400;
          letter-spacing: 0;
        }

        .login-form h2 {
          color: #fff;
          margin: 0 0 0.75rem 0;
          font-weight: 500;
          text-align: center;
          font-size: 1.5rem;
        }

        .auth-eyebrow {
          margin: 0 0 0.75rem;
          color: var(--accent-color);
          text-align: center;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .auth-subtitle {
          margin: 0 auto 1.5rem;
          max-width: 270px;
          text-align: center;
          color: #999;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .auth-form-content {
          margin-top: 1.5rem;
        }

        .auth-switch {
          margin: 1.5rem 0 0;
          text-align: center;
          color: #999;
          font-size: 0.875rem;
        }

        :global(.auth-switch-link) {
          color: var(--accent-color);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-thickness: 1px;
        }

        :global(.auth-switch-link:hover) {
          color: var(--lamp-shade);
          text-decoration-color: var(--lamp-shade);
        }

        :global(.form-group) {
          margin-bottom: 1.2rem;
        }

        :global(.form-group label) {
          display: block;
          color: #999;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          margin-left: 5px;
        }

        :global(.form-group input) {
          width: 100%;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid transparent;
          border-radius: 15px;
          color: white;
          outline: none;
          transition: 0.3s;
          font-size: 1rem;
        }

        :global(.form-group input::placeholder) {
          color: rgba(255, 255, 255, 0.35);
        }

        :global(.form-group input:focus) {
          border-color: var(--accent-color);
          background: rgba(255, 255, 255, 0.12);
        }

        :global(.login-btn) {
          width: 100%;
          padding: 15px;
          background: linear-gradient(
            135deg,
            #bf953f,
            #fcf6ba,
            #b38728,
            #fcf6ba,
            #aa771c
          );
          border: none;
          border-radius: 15px;
          font-weight: 600;
          color: #121417;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 10px;
          font-size: 1rem;
        }

        :global(.login-btn:hover) {
          transform: scale(1.02);
          background: var(--lamp-shade);
        }

        @media (max-width: 768px) {
          .container {
            gap: 2rem;
            padding: 2rem 1rem;
          }

          .lamp-wrapper {
            width: 220px;
            height: 315px;
          }

          .login-form {
            width: min(340px, calc(100vw - 2rem));
          }
        }
      `}</style>
    </main>
  );
}
