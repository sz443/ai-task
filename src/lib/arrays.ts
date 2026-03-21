export function splitMultiline(value?: string | null) {
  return (value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinMultiline(items?: string[] | null) {
  return (items || []).map((item) => item.trim()).filter(Boolean).join("\n");
}
