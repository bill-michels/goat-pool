export function normalizeName(s: string): string {
  return s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function lastName(s: string): string {
  return normalizeName(s).split(" ").slice(-1)[0];
}

export function findAthlete<T extends { id: string; name: string }>(
  sfName: string,
  athletes: T[]
): T | undefined {
  const n = normalizeName(sfName);
  const parts = n.split(" ");
  const reversed = parts.length >= 2 ? [...parts].reverse().join(" ") : null;
  const l = lastName(sfName);
  const byLastName = l.length > 3 ? athletes.filter(a => lastName(a.name) === l) : [];
  return athletes.find(a => normalizeName(a.name) === n)
    ?? (reversed ? athletes.find(a => normalizeName(a.name) === reversed) : undefined)
    ?? athletes.find(a => { const d = normalizeName(a.name); return d.includes(" ") && n.includes(d); })
    ?? (byLastName.length === 1 ? byLastName[0] : undefined);
}
