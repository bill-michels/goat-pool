export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tId = searchParams.get("tId");
  const sId = searchParams.get("sId");
  const round = searchParams.get("round");
  const page = searchParams.get("page") ?? "0";

  if (!tId || !sId) {
    return Response.json({ error: "Missing tId or sId" }, { status: 400 });
  }

  // Prefer round-based endpoint when round is specified; fall back to paginated last-events
  const sfPath = round ? `/events/round/${round}` : `/events/last/${page}`;
  const sfUrl = `https://api.sofascore.com/api/v1/unique-tournament/${tId}/season/${sId}${sfPath}`;

  try {
    const res = await fetch(sfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.sofascore.com/",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.sofascore.com",
      },
    });

    if (!res.ok) {
      return Response.json({ error: `Sofascore returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    // Pass through the data plus a diagnostic field showing top-level keys
    return Response.json({ ...data, _keys: Object.keys(data), _url: sfUrl });
  } catch (e: any) {
    return Response.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
