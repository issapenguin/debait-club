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
  const { data: caseRow } = await supabase
    .from('cases')
    .select('body, side, topic_id, is_deleted')
    .eq('id', Number(id))
    .maybeSingle();

  const c = caseRow as {
    body?: string;
    side?: string;
    topic_id?: number;
    is_deleted?: boolean;
  } | null;

  let proposition = 'Debait Club';
  if (c?.topic_id) {
    const { data: topic } = await supabase
      .from('topics')
      .select('proposition')
      .eq('id', c.topic_id)
      .maybeSingle();
    proposition = (topic as { proposition?: string } | null)?.proposition ?? proposition;
  }

  const side = c?.side === 'against' ? 'AGAINST' : 'FOR';
  const snippet = c?.is_deleted
    ? 'This case was archived.'
    : clamp(c?.body ?? '', 160);
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
              color: side === 'FOR' ? '#052e16' : '#450a0a',
              backgroundColor: side === 'FOR' ? '#bbf7d0' : '#fecaca',
              borderRadius: 999,
              padding: '10px 26px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
            }}
          >
            {side}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.2, color: '#fafafa' }}>
            {clamp(proposition, 120)}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: '#d4d4d4',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            “{snippet}”
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 30, color: '#d4d4d4', fontFamily: 'Inter, sans-serif' }}>
            Join the debate. Change your mind.
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
