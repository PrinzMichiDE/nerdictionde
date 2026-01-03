export function parseSteamUrl(url: string): string | null {
  const match = url.match(/store\.steampowered\.com\/app\/(\d+)/);
  return match ? match[1] : null;
}

