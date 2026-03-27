"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { useOnboardingStore } from "~/stores/onboarding-store";
import { useSidebarStore } from "~/stores/sidebar-store";
import { OnboardingTooltip } from "./onboarding-tooltip";

type Placement = "top" | "bottom" | "left" | "right";

interface StepConfig {
  targetSelector: string;
  description: string;
  placement: Placement;
}

const STEPS: StepConfig[] = [
  {
    targetSelector: '[data-onboarding="fab"]',
    description: "Capture ideas instantly with this button.",
    placement: "top",
  },
  {
    targetSelector: '[data-onboarding="status-tabs"]',
    description:
      "Filter scripts by status \u2014 Idea, Writing, Ready, Posted.",
    placement: "bottom",
  },
  {
    targetSelector: '[data-onboarding="search"]',
    description: "Search across all your scripts and tags.",
    placement: "right",
  },
];

export function OnboardingTour() {
  const pathname = usePathname();
  const { isActive, currentStep, start, nextStep, dismiss } =
    useOnboardingStore();
  const { isCollapsed, toggle } = useSidebarStore();
  const hasStartedRef = useRef(false);

  const { data: preferences, isLoading } =
    api.user.getPreferences.useQuery();
  const updatePreferences = api.user.updatePreferences.useMutation();

  // Start tour when preferences load and onboarding not complete
  useEffect(() => {
    if (isLoading || hasStartedRef.current) return;
    if (preferences?.onboardingComplete === true) return;

    // Wait for target elements to appear in the DOM
    let frameId: number;
    const waitForTargets = () => {
      const fab = document.querySelector('[data-onboarding="fab"]');
      if (fab) {
        hasStartedRef.current = true;
        start();
      } else {
        frameId = requestAnimationFrame(waitForTargets);
      }
    };
    frameId = requestAnimationFrame(waitForTargets);

    return () => cancelAnimationFrame(frameId);
  }, [isLoading, preferences, start]);

  // Expand sidebar for search step
  useEffect(() => {
    if (!isActive) return;
    if (currentStep === 2 && isCollapsed) {
      toggle();
    }
  }, [isActive, currentStep, isCollapsed, toggle]);

  // Auto-dismiss if user navigates away from dashboard
  useEffect(() => {
    if (isActive && pathname !== "/") {
      handleDismiss();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isActive]);

  const handleDismiss = useCallback(() => {
    dismiss();
    updatePreferences.mutate({ onboardingComplete: true });
  }, [dismiss, updatePreferences]);

  const handleNext = useCallback(() => {
    if (currentStep >= STEPS.length - 1) {
      // Last step — complete
      handleDismiss();
    } else {
      nextStep();
    }
  }, [currentStep, nextStep, handleDismiss]);

  if (!isActive) return null;

  const step = STEPS[currentStep];
  if (!step) return null;

  return (
    <OnboardingTooltip
      key={currentStep}
      targetSelector={step.targetSelector}
      placement={step.placement}
      stepIndex={currentStep}
      totalSteps={STEPS.length}
      description={step.description}
      onNext={handleNext}
      onDismiss={handleDismiss}
      isLastStep={currentStep === STEPS.length - 1}
    />
  );
}
