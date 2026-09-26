import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Render on demand: the display font is fetched from Google Fonts at
// request time, which isn't available during the static build.
export const dynamic = 'force-dynamic';

async function loadFraunces(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DebaitClub/1.0)' } },
    ).then((r) => r.text());
    const url = css.match(/url\((https:[^)]+?\.woff2)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const fontData = await loadFraunces();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0a0a0a',
          padding: 72,
          fontFamily: 'Fraunces, Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 8,
            color: '#a3a3a3',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          DEBAIT CLUB
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 600,
            lineHeight: 1.1,
            color: '#fafafa',
          }}
        >
          Change your mind weekly.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: '#d4d4d4',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Read both sides. Make your case.
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#737373',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            debait.club
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: 'Fraunces', data: fontData, weight: 600 as const, style: 'normal' as const }]
        : [],
    },
  );
}
