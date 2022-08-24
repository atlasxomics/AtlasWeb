export function getDarkTheme(): boolean {
  const existing = localStorage.getItem('darkTheme');
  if (existing) { return JSON.parse(existing); }

  return false;
}

export function setDarkTheme(val: boolean) {
  localStorage.setItem('darkTheme', JSON.stringify(val));
}
