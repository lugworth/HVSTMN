/** Pure 7x7 retro pixel-art bitmaps and CSS box-shadow builder for desktop toolbar buttons. */

export type ToolbarIconId =
  | 'hoe'
  | 'sickle'
  | 'hammer'
  | 'axe'
  | 'watering_can'
  | 'fishing_rod'
  | 'act'
  | 'swap'
  | 'bag'
  | 'today'
  | 'notes'
  | 'diary'
  | 'menu'
  | 'map'
  | 'horse'
  | 'row'
  | 'info';

export const ICON_GRID = 7;

/** 7x7 pixel sprites (`#` = lit pixel, `.` = transparent). */
export const PIXEL_ICONS: Record<ToolbarIconId, readonly string[]> = {
  hoe: [
    '..#####',
    '.#...#.',
    '....#..',
    '...#...',
    '..#....',
    '.#.....',
    '#......',
  ],
  sickle: [
    '..####.',
    '.#....#',
    '#.....#',
    '.....#.',
    '....#..',
    '...#...',
    '..#....',
  ],
  hammer: [
    '.#####.',
    '.#####.',
    '...#...',
    '...#...',
    '...#...',
    '...#...',
    '...#...',
  ],
  axe: [
    '..###..',
    '.####..',
    '.###...',
    '...#...',
    '...#...',
    '...#...',
    '...#...',
  ],
  watering_can: [
    '..###..',
    '.#...#.',
    '#..####',
    '.#.####',
    '...####',
    '...####',
    '.......',
  ],
  fishing_rod: [
    '....##.',
    '...#..#',
    '..#...#',
    '.#....#',
    '#......',
    '......#',
    '.....#.',
  ],
  act: [
    '...#...',
    '...#...',
    '..###..',
    '#######',
    '..###..',
    '...#...',
    '...#...',
  ],
  swap: [
    '....#..',
    '.#####.',
    '....#..',
    '.......',
    '..#....',
    '.#####.',
    '..#....',
  ],
  bag: [
    '..###..',
    '.#...#.',
    '#######',
    '#..#..#',
    '#######',
    '#.....#',
    '.#####.',
  ],
  today: [
    '#..#..#',
    '.......',
    '..###..',
    '#.###.#',
    '..###..',
    '.......',
    '#..#..#',
  ],
  notes: [
    '.##.##.',
    '#######',
    '#######',
    '#######',
    '.#####.',
    '..###..',
    '...#...',
  ],
  diary: [
    '.##.##.',
    '#..#..#',
    '#.##.##',
    '#..#..#',
    '#.##.##',
    '#..#..#',
    '.##.##.',
  ],
  menu: [
    '.......',
    '#######',
    '.......',
    '#######',
    '.......',
    '#######',
    '.......',
  ],
  map: [
    '#######',
    '#.#...#',
    '#.#.###',
    '#...#.#',
    '###.#.#',
    '#...#.#',
    '#######',
  ],
  horse: [
    '..##...',
    '.####..',
    '######.',
    '###.##.',
    '.###...',
    '.###...',
    '.##.##.',
  ],
  row: [
    '#.#.#..',
    '.......',
    '####.#.',
    '######.',
    '####.#.',
    '.......',
    '#.#.#..',
  ],
  info: [
    '..###..',
    '.#...#.',
    '.#.###.',
    '.#.....',
    '.#.###.',
    '.#...#.',
    '..###..',
  ],
};

const TOOL_TO_ICON: Record<string, ToolbarIconId> = {
  Sickle: 'sickle',
  Hoe: 'hoe',
  Hammer: 'hammer',
  Axe: 'axe',
  'Watering Can': 'watering_can',
  'Fishing Rod': 'fishing_rod',
};

/** Maps the equipped engine tool name to its matching pixel sprite. */
export function toolIconId(toolName: string): ToolbarIconId {
  return TOOL_TO_ICON[toolName] ?? 'hoe';
}

/** Converts a 7x7 bitmap into an integer-pixel CSS box-shadow sprite (no antialiasing). */
export function bitmapToBoxShadow(bitmap: readonly string[], px = 2): string {
  const shadows: string[] = [];
  for (let y = 0; y < bitmap.length; y++) {
    const row = bitmap[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') {
        shadows.push(`${x * px}px ${y * px}px 0 0 currentColor`);
      }
    }
  }
  return shadows.join(', ');
}
