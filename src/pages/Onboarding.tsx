import React from "react";
import { SinglePageOnboarding } from "@/components/onboarding/SinglePageOnboarding";
import { OnboardingProvider } from "@/hooks/useOnboarding";

export default function Onboarding() {
  return (
    <OnboardingProvider>
      <SinglePageOnboarding />
    </OnboardingProvider>
  );
}