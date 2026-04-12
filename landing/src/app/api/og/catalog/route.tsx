import { ImageResponse } from '@vercel/og';
import statsData from '@/lib/stats.json';

export const runtime = 'edge';

export async function GET() {
  const categoryCount = Object.keys(statsData.categoryBreakdown).length;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d0d0d',
          padding: '60px',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 56 }}>🦞</span>
          <span style={{ fontSize: 32, color: '#ef4444', fontWeight: 700 }}>APIClaw</span>
          <span style={{ fontSize: 24, color: '#525252', marginLeft: 8 }}>/ catalog</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
            API Catalog
          </div>
          <div style={{ fontSize: 28, color: '#a3a3a3', maxWidth: 700, lineHeight: 1.4 }}>
            Browse {statsData.apiCount.toLocaleString()}+ APIs across {categoryCount} categories. {statsData.callableCount.toLocaleString()}+ callable instantly through MCP or API key.
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#ef4444' }}>{statsData.apiCount.toLocaleString()}+</span>
            <span style={{ fontSize: 18, color: '#737373' }}>Discoverable APIs</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#22c55e' }}>{statsData.callableCount.toLocaleString()}+</span>
            <span style={{ fontSize: 18, color: '#737373' }}>Callable APIs</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#a78bfa' }}>{categoryCount}</span>
            <span style={{ fontSize: 18, color: '#737373' }}>Categories</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#f59e0b' }}>{statsData.managedCount}</span>
            <span style={{ fontSize: 18, color: '#737373' }}>Managed Providers</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
