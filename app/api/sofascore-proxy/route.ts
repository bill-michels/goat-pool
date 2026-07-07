export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tId = searchParams.get("tId");
  const sId = searchParams.get("sId");
  const page = searchParams.get("page") ?? "0";

  if (!tId || !sId) {
    return Response.json({ error: "Missing tId or sId" }, { status: 400 });
  }

  const sfUrl = `https://api.sofascore.com/api/v1/unique-tournament/${tId}/season/${sId}/events/last/${page}`;

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
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
