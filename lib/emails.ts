const green = "#4A7C59";
const cream = "#F5F3EF";
const charcoal = "#2D2D2D";
const gray = "#6B7280";
const grayLight = "#E5E7EB";
const red = "#EF4444";
const amber = "#D97706";

function base(body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${charcoal};">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">
  <tr><td style="text-align:center;padding-bottom:28px;">
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="${green}"/>
      <circle cx="20" cy="20" r="11" stroke="${cream}" stroke-width="1.8" fill="none"/>
      <path d="M11.5 9.5 Q20 18, 11.5 30.5" stroke="${cream}" stroke-width="1.8" fill="none"/>
      <path d="M28.5 9.5 Q20 18, 28.5 30.5" stroke="${cream}" stroke-width="1.8" fill="none"/>
    </svg>
    <span style="display:block;font-size:20px;font-weight:700;color:${charcoal};letter-spacing:-0.5px;margin-top:8px;">Goat Pool</span>
  </td></tr>
  <tr><td style="background:#fff;border-radius:16px;border:1px solid ${grayLight};padding:36px;">
    ${body}
  </td></tr>
  <tr><td style="text-align:center;padding-top:24px;font-size:12px;color:${gray};">
    You're receiving this because someone invited you to a Goat Pool.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;padding:13px 28px;border-radius:10px;background:${green};color:#fff;font-size:15px;font-weight:600;text-decoration:none;">${label}</a>`;
}

export function inviteEmail({
  poolName, tournamentName, commissionerUsername, joinUrl, feePerLife,
}: {
  poolName: string;
  tournamentName: string;
  commissionerUsername: string;
  joinUrl: string;
  feePerLife: number;
}) {
  const feeText = feePerLife > 0
    ? `<p style="font-size:14px;color:${gray};margin:0 0 24px;">Entry fee: <strong style="color:${charcoal};">$${(feePerLife / 100).toFixed(2)} per life</strong> (1 or 2 lives — your choice)</p>`
    : `<p style="font-size:14px;color:${gray};margin:0 0 24px;">This pool is free to enter.</p>`;

  return base(`
    <h1 style="font-size:22px;font-weight:800;color:${charcoal};margin:0 0 6px;letter-spacing:-0.5px;">You're invited!</h1>
    <p style="font-size:15px;color:${gray};margin:0 0 24px;"><strong style="color:${charcoal};">${commissionerUsername}</strong> invited you to join <strong style="color:${charcoal};">${poolName}</strong> for ${tournamentName}.</p>
    ${feeText}
    <p style="font-size:14px;color:${gray};margin:0 0 28px;">Each round you pick one athlete to win. Pick wrong and you lose a life. Last one standing wins.</p>
    <div style="text-align:center;margin-bottom:24px;">${btn(joinUrl, "Join Pool")}</div>
    <p style="font-size:12px;color:${gray};text-align:center;margin:0;">Or copy this link: <a href="${joinUrl}" style="color:${green};">${joinUrl}</a></p>
  `);
}

export function pickReminderEmail({
  username, poolName, roundLabel, lockDeadline, pickUrl,
}: {
  username: string;
  poolName: string;
  roundLabel: string;
  lockDeadline: string;
  pickUrl: string;
}) {
  return base(`
    <h1 style="font-size:22px;font-weight:800;color:${amber};margin:0 0 6px;letter-spacing:-0.5px;">Pick reminder</h1>
    <p style="font-size:15px;color:${gray};margin:0 0 8px;">Hi ${username},</p>
    <p style="font-size:15px;color:${gray};margin:0 0 24px;">Your pick for <strong style="color:${charcoal};">${roundLabel}</strong> in <strong style="color:${charcoal};">${poolName}</strong> is due soon.</p>
    <div style="background:#FEF3C7;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="font-size:14px;font-weight:600;color:${amber};margin:0;">Locks: ${lockDeadline}</p>
    </div>
    <div style="text-align:center;">${btn(pickUrl, "Place My Pick")}</div>
  `);
}

export function roundResultEmail({
  username, poolName, roundLabel, pickAthleteName, result, livesRemaining, livesPurchased, isEliminated, poolUrl,
}: {
  username: string;
  poolName: string;
  roundLabel: string;
  pickAthleteName: string;
  result: "win" | "loss";
  livesRemaining: number;
  livesPurchased: number;
  isEliminated: boolean;
  poolUrl: string;
}) {
  const won = result === "win";

  const resultBanner = won
    ? `<div style="background:#E8F0EA;border-radius:10px;padding:14px 18px;margin-bottom:24px;"><p style="font-size:15px;font-weight:700;color:${green};margin:0;">✓ ${pickAthleteName} won — you survive!</p></div>`
    : isEliminated
    ? `<div style="background:#FEF2F2;border-radius:10px;padding:14px 18px;margin-bottom:24px;"><p style="font-size:15px;font-weight:700;color:${red};margin:0;">✗ ${pickAthleteName} lost — you've been eliminated.</p></div>`
    : `<div style="background:#FEF2F2;border-radius:10px;padding:14px 18px;margin-bottom:24px;"><p style="font-size:15px;font-weight:700;color:${red};margin:0;">✗ ${pickAthleteName} lost — you lose a life.</p><p style="font-size:13px;color:${red};margin:6px 0 0;">${livesRemaining} of ${livesPurchased} lives remaining.</p></div>`;

  return base(`
    <h1 style="font-size:22px;font-weight:800;color:${charcoal};margin:0 0 6px;letter-spacing:-0.5px;">${roundLabel} results</h1>
    <p style="font-size:15px;color:${gray};margin:0 0 24px;">Hi ${username}, here's how you did in <strong style="color:${charcoal};">${poolName}</strong>.</p>
    ${resultBanner}
    ${isEliminated
      ? `<p style="font-size:14px;color:${gray};margin:0 0 24px;">Better luck next tournament. You can still view the pool and follow along.</p>`
      : `<p style="font-size:14px;color:${gray};margin:0 0 24px;">Stay alive — picks for the next round open soon.</p>`
    }
    <div style="text-align:center;">${btn(poolUrl, "View Pool")}</div>
  `);
}
