import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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

function clamp(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await supabase
    .from('topics')
    .select('proposition, category')
    .eq('id', Number(id))
    .maybeSingle();

  const proposition = clamp(
    (data as { proposition?: string } | null)?.proposition ?? 'Debait Club',
    150,
  );
  const category = (data as { category?: string } | null)?.category ?? 'Debate';
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              fontSize: 24,
              color: '#0a0a0a',
              backgroundColor: '#fafafa',
              borderRadius: 999,
              padding: '10px 26px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
            }}
          >
            {category}
          </div>
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.15,
            color: '#fafafa',
          }}
        >
          {proposition}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 30, color: '#d4d4d4', fontFamily: 'Inter, sans-serif' }}>
            Read both sides. Make your case.
          </div>
          <div style={{ fontSize: 30, color: '#737373', fontFamily: 'Inter, sans-serif' }}>
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
