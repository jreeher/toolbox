"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completeOnboardingAction, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Saving..." : "Continue"}
    </button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useFormState(completeOnboardingAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="text"
        name="username"
        placeholder="Username"
        required
        minLength={3}
        className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
      />
      <textarea
        name="bio"
        placeholder="Bio (optional)"
        rows={3}
        className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
      />
      {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
