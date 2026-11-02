import dictionary from "@/messages/de-extra";
export function copy<K extends keyof typeof dictionary>(
  key: K,
): (typeof dictionary)[K] {
  return dictionary[key];
}
