export type Rgb = { r: number; g: number; b: number };

const HEX = /^#([0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

export function parseHex(value: string): Rgb {
  const match = HEX.exec(value);
  if (!match?.[1]) {
    throw new Error(`Invalid color: ${value}`);
  }
  const number = Number.parseInt(match[1], 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

function channel(value: number) {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

export function luminance(color: string): number {
  const { r, g, b } = parseHex(color);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}

export function mix(color: string, target: string, amount: number): string {
  const from = parseHex(color);
  const to = parseHex(target);
  return toHex({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  });
}

export function ensureContrast(color: string, background: string, minimum: number): string {
  const target = luminance(background) > 0.5 ? '#000000' : '#FFFFFF';
  let current = color.toUpperCase();
  for (let step = 1; step <= 20 && contrast(current, background) < minimum; step += 1) {
    current = mix(color, target, step * 0.05);
  }
  return current;
}

export function readableOn(color: string): '#FFFFFF' | '#0B0B0F' {
  return contrast(color, '#FFFFFF') >= contrast(color, '#0B0B0F') ? '#FFFFFF' : '#0B0B0F';
}
