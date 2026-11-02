import dictionary from "@/messages/de-ui.json";
// Stable source dictionary for UI copy. English rollout can supply the same keys.
export function ui(key: keyof typeof dictionary): string {
  return dictionary[key];
}
