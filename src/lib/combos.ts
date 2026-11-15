export interface ComboSource {
  id: string;
  includes?: string[];
}

export function applyCombos(selected: string[], services: ComboSource[]): string[] {
  const combos = services
    .filter((service) => (service.includes?.length ?? 0) > 1)
    .map((service) => ({ id: service.id, items: service.includes ?? [] }));
  let result = [...new Set(selected)];
  for (const combo of combos) {
    if (result.includes(combo.id)) {
      result = result.filter((id) => !combo.items.includes(id));
    }
  }
  for (const combo of [...combos].sort((a, b) => b.items.length - a.items.length)) {
    if (combo.items.every((id) => result.includes(id))) {
      const position = result.findIndex((id) => combo.items.includes(id));
      result = result.filter((id) => !combo.items.includes(id));
      result.splice(Math.max(0, position), 0, combo.id);
    }
  }
  return result;
}

export function comboSavings(
  comboId: string,
  services: (ComboSource & { priceCents: number })[],
): number {
  const combo = services.find((service) => service.id === comboId);
  if (!combo?.includes?.length) {
    return 0;
  }
  const separate = combo.includes.reduce(
    (sum, id) => sum + (services.find((service) => service.id === id)?.priceCents ?? 0),
    0,
  );
  return Math.max(0, separate - combo.priceCents);
}
