const ICONS: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2M6 12h4"/>',
  building: '<path d="M4 20V6l8-3 8 3v14"/><path d="M9 20v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>',
  grid: '<path d="M4 6h16v12H4z"/><path d="M4 10h16M4 14h16M9 6v12M15 6v12"/>',
  carport: '<path d="M3 18V9l9-4 9 4v9"/><path d="M7 18v-4h10v4"/><path d="M6 11h12"/>',
  lamp: '<path d="M9 18h6M10 22h4M12 18v4"/><path d="M8 14a4 4 0 1 1 8 0c0 2-2 3-2 4H10c0-1-2-2-2-4z"/>',
  tower: '<path d="M12 2 8 22h8L12 2z"/><path d="M9 10h6M8 16h8M5 8l2 2M19 8l-2 2"/>',
  cabinet: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M5 8h14M12 8v13M9 5.5h.01M15 5.5h.01"/>',
  fiber: '<path d="M4 16c4-8 12-8 16 0"/><path d="M4 12c4-8 12-8 16 0"/><circle cx="6" cy="16" r="1.4"/><circle cx="18" cy="16" r="1.4"/>',
  node: '<rect x="3" y="8" width="6" height="8" rx="1"/><rect x="15" y="4" width="6" height="6" rx="1"/><rect x="15" y="14" width="6" height="6" rx="1"/><path d="M9 12h6M18 10v4"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3z"/><path d="m9 12 2 2 4-4"/>',
  datacenter: '<rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="11" width="18" height="6" rx="1"/><path d="M7 6h.01M7 14h.01M11 6h6M11 14h6"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h.01M7 17h.01"/>',
  noc: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4M7 8l3 3 3-2 4 3"/>',
}

export function iconSvg(name: string) {
  const body = ICONS[name] ?? ICONS.building
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}
