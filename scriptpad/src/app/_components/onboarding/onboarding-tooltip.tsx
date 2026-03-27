"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom" | "left" | "right";

interface OnboardingTooltipProps {
  targetSelector: string;
  placement: Placement;
  stepIndex: number;
  totalSteps: number;
  description: string;
  onNext: () => void;
  onDismiss: () => void;
  isLastStep: boolean;
}

interface Position {
  top: number;
  left: number;
  arrowTop: number;
  arrowLeft: number;
  arrowDirection: Placement;
}

const ARROW_SIZE = 8;
const GAP = 12;

function computePosition(
  targetRect: DOMRect,
  tooltipRect: { width: number; height: number },
  placement: Placement,
): Position {
  let top = 0;
  let left = 0;
  let arrowTop = 0;
  let arrowLeft = 0;
  const arrowDirection = placement;

  switch (placement) {
    case "top":
      top = targetRect.top - tooltipRect.height - GAP - ARROW_SIZE;
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
      arrowTop = tooltipRect.height;
      arrowLeft = tooltipRect.width / 2 - ARROW_SIZE;
      break;
    case "bottom":
      top = targetRect.bottom + GAP + ARROW_SIZE;
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
      arrowTop = -ARROW_SIZE * 2;
      arrowLeft = tooltipRect.width / 2 - ARROW_SIZE;
      break;
    case "left":
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
      left = targetRect.left - tooltipRect.width - GAP - ARROW_SIZE;
      arrowTop = tooltipRect.height / 2 - ARROW_SIZE;
      arrowLeft = tooltipRect.width;
      break;
    case "right":
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
      left = targetRect.right + GAP + ARROW_SIZE;
      arrowTop = tooltipRect.height / 2 - ARROW_SIZE;
      arrowLeft = -ARROW_SIZE * 2;
      break;
  }

  // Clamp to viewport
  const padding = 16;
  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
  top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

  return { top, left, arrowTop, arrowLeft, arrowDirection };
}

function arrowStyle(pos: Position): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    top: pos.arrowTop,
    left: pos.arrowLeft,
  };

  const color = "var(--color-surface-elevated)";
  switch (pos.arrowDirection) {
    case "top":
      return { ...base, borderLeft: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid transparent`, borderTop: `${ARROW_SIZE}px solid ${color}` };
    case "bottom":
      return { ...base, borderLeft: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid transparent`, borderBottom: `${ARROW_SIZE}px solid ${color}` };
    case "left":
      return { ...base, borderTop: `${ARROW_SIZE}px solid transparent`, borderBottom: `${ARROW_SIZE}px solid transparent`, borderLeft: `${ARROW_SIZE}px solid ${color}` };
    case "right":
      return { ...base, borderTop: `${ARROW_SIZE}px solid transparent`, borderBottom: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid ${color}` };
  }
}

export function OnboardingTooltip({
  targetSelector,
  placement,
  stepIndex,
  totalSteps,
  description,
  onNext,
  onDismiss,
  isLastStep,
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updatePosition = useCallback(() => {
    const target = document.querySelector(targetSelector);
    if (!target || !tooltipRef.current) return;

    const tRect = target.getBoundingClientRect();
    setTargetRect(tRect);

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPosition(computePosition(tRect, { width: tooltipRect.width, height: tooltipRect.height }, placement));
  }, [targetSelector, placement]);

  // Position on mount and when step changes
  useLayoutEffect(() => {
    // Small delay to ensure tooltip is rendered and measurable
    const frame = requestAnimationFrame(() => {
      updatePosition();
    });
    return () => cancelAnimationFrame(frame);
  }, [updatePosition]);

  // Recalculate on resize/scroll
  useEffect(() => {
    const handleUpdate = () => updatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [updatePosition]);

  // Spotlight styles for the target element
  const spotlightStyle: React.CSSProperties | null = targetRect
    ? {
        position: "fixed",
        top: targetRect.top - 4,
        left: targetRect.left - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
        borderRadius: 12,
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 2px var(--color-accent)",
        zIndex: 55,
        pointerEvents: "none" as const,
      }
    : null;

  return createPortal(
    <>
      {/* Semi-transparent backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
        }}
        onClick={onDismiss}
      />

      {/* Spotlight cutout around target */}
      {spotlightStyle && <div style={spotlightStyle} />}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="onboarding-tooltip-enter"
        style={{
          position: "fixed",
          zIndex: 60,
          top: position?.top ?? -9999,
          left: position?.left ?? -9999,
          width: 280,
          visibility: position ? "visible" : "hidden",
        }}
      >
        {/* Arrow */}
        {position && <div style={arrowStyle(position)} />}

        <div
          style={{
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Step indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stepIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background:
                    i === stepIndex
                      ? "var(--color-accent)"
                      : "var(--color-border-light)",
                  transition: "all 200ms ease",
                }}
              />
            ))}
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "var(--color-text-muted)",
              }}
            >
              {stepIndex + 1} of {totalSteps}
            </span>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--color-text-primary)",
              margin: "0 0 16px 0",
            }}
          >
            {description}
          </p>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={onDismiss}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-muted)",
                fontSize: 13,
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              Skip tour
            </button>
            <button
              onClick={onNext}
              style={{
                background: "var(--color-accent)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--color-accent-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--color-accent)")
              }
            >
              {isLastStep ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
