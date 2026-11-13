import { ensureContrast, isHexColor, readableOn } from './color';

export const DEFAULT_PRIMARY = '#D62839';
export const DEFAULT_SECONDARY = '#1E4FD8';

const LIGHT_BACKGROUND = '#FFFFFF';
const DARK_BACKGROUND = '#0B0B0F';
const MINIMUM_CONTRAST = 3;

export type BrandVariables = Record<
  | '--tenant-brand-light'
  | '--tenant-brand-dark'
  | '--tenant-brand-2-light'
  | '--tenant-brand-2-dark'
  | '--tenant-on-brand'
  | '--tenant-on-brand-dark',
  string
>;

function safe(color: string | null | undefined, fallback: string) {
  return color && isHexColor(color) ? color.toUpperCase() : fallback;
}

export function brandVariables(
  primary: string | null | undefined,
  secondary: string | null | undefined,
): BrandVariables {
  const main = safe(primary, DEFAULT_PRIMARY);
  const accent = safe(secondary, DEFAULT_SECONDARY);
  const light = ensureContrast(main, LIGHT_BACKGROUND, MINIMUM_CONTRAST);
  const dark = ensureContrast(main, DARK_BACKGROUND, MINIMUM_CONTRAST);
  return {
    '--tenant-brand-light': light,
    '--tenant-brand-dark': dark,
    '--tenant-brand-2-light': ensureContrast(accent, LIGHT_BACKGROUND, MINIMUM_CONTRAST),
    '--tenant-brand-2-dark': ensureContrast(accent, DARK_BACKGROUND, MINIMUM_CONTRAST),
    '--tenant-on-brand': readableOn(light),
    '--tenant-on-brand-dark': readableOn(dark),
  };
}

export function modeVariables(
  primary: string | null | undefined,
  secondary: string | null | undefined,
  mode: 'light' | 'dark',
): Record<'--brand' | '--brand-2' | '--on-brand', string> {
  const vars = brandVariables(primary, secondary);
  return mode === 'dark'
    ? {
        '--brand': vars['--tenant-brand-dark'],
        '--brand-2': vars['--tenant-brand-2-dark'],
        '--on-brand': vars['--tenant-on-brand-dark'],
      }
    : {
        '--brand': vars['--tenant-brand-light'],
        '--brand-2': vars['--tenant-brand-2-light'],
        '--on-brand': vars['--tenant-on-brand'],
      };
}
