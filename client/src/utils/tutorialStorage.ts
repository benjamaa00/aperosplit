const TUTORIAL_VERSION = 1;

export type TutorialId =
  | "main"
  | "expense"
  | "balances"
  | "stats"
  | "payments"
  | "categories"
  | "profile";

function key(id: TutorialId): string {
  return `tutorial.${id}.v${TUTORIAL_VERSION}`;
}

export function isTutorialCompleted(id: TutorialId): boolean {
  return localStorage.getItem(key(id)) === "done";
}

export function markTutorialCompleted(id: TutorialId): void {
  localStorage.setItem(key(id), "done");
}

export function saveTutorialStep(id: TutorialId, step: number): void {
  localStorage.setItem(`${key(id)}_step`, String(step));
}

export function getTutorialStep(id: TutorialId): number {
  return parseInt(localStorage.getItem(`${key(id)}_step`) || "0", 10);
}

export function clearTutorialStep(id: TutorialId): void {
  localStorage.removeItem(`${key(id)}_step`);
}

export function resetAllTutorials(): void {
  (["main", "expense", "balances", "stats", "payments", "categories", "profile"] as TutorialId[]).forEach((id) => {
    localStorage.removeItem(key(id));
    localStorage.removeItem(`${key(id)}_step`);
  });
}

export function isAnyTutorialIncomplete(): boolean {
  return !isTutorialCompleted("main");
}
