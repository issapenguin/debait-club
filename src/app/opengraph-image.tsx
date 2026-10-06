import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Render on demand: the topic list behind the homepage card changes weekly.
export const dynamic = 'force-dynamic';

// The display font is bundled in the repo so the image never depends on a
// runtime fetch to Google Fonts (a failed fetch used to 500 the route).
async function loadFraunces(): Promise<ArrayBuffer> {
  const buf = await readFile(
    join(process.cwd(), 'src/app/fonts/fraunces-semibold.ttf'),
  );
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}

// The fishhook logo as a data-URI SVG (light fill for the dark card).
async function loadLogo(): Promise<string> {
  const svg = await readFile(join(process.cwd(), 'src/app/icon.svg'), 'utf8');
  const match = svg.match(/<path d="([^"]+)"/);
  const d = match?.[1] ?? '';
  const light = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#fafafa" d="${d}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(light).toString('base64')}`;
}

export default async function OgImage() {
  const fontData = await loadFraunces();
  const logoSrc = await loadLogo();

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
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <img src={logoSrc} width={34} height={44} alt="" />
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
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 600,
            lineHeight: 1.1,
            color: '#fafafa',
          }}
        >
          State your case.
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
            Nothing is black and white.
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
      fonts: [{ name: 'Fraunces', data: fontData, weight: 600 as const, style: 'normal' as const }],
    },
  );
}
