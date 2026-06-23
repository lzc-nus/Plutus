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
import "./renaissance-auth-shell.css";

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
    </main>
  );
}
