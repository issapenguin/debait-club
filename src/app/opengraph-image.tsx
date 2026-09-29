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
      fonts: [{ name: 'Fraunces', data: fontData, weight: 600 as const, style: 'normal' as const }],
    },
  );
}
