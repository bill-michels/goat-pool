export const runtime = "edge";

const SF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://www.sofascore.com/",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://www.sofascore.com",
};

async function sfFetch(url: string) {
  const res = await fetch(url, { headers: SF_HEADERS });
  if (!res.ok) return Response.json({ error: `Sofascore returned ${res.status}` }, { status: 502 });
  const data = await res.json();
  return Response.json(data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Search tournaments
  if (action === "search") {
    const q = searchParams.get("q");
    if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
    return sfFetch(`https://api.sofascore.com/api/v1/search/all?q=${encodeURIComponent(q)}&page=0`);
  }

  // Fetch seasons for a tournament
  if (action === "seasons") {
    const tId = searchParams.get("tId");
    if (!tId) return Response.json({ error: "Missing tId" }, { status: 400 });
    return sfFetch(`https://api.sofascore.com/api/v1/unique-tournament/${tId}/seasons`);
  }

  // Fetch events (original behavior)
  const tId = searchParams.get("tId");
  const sId = searchParams.get("sId");
  const round = searchParams.get("round");
  const page = searchParams.get("page") ?? "0";

  if (!tId || !sId) {
    return Response.json({ error: "Missing tId or sId" }, { status: 400 });
  }

  const sfPath = round ? `/events/round/${round}` : `/events/last/${page}`;
  const sfUrl = `https://api.sofascore.com/api/v1/unique-tournament/${tId}/season/${sId}${sfPath}`;

  try {
    return sfFetch(sfUrl);
  } catch (e: any) {
    return Response.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
