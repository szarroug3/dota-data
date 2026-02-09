import { NextResponse } from 'next/server';

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Dota Data">
  <rect width="64" height="64" rx="12" fill="#111827" />
  <path d="M18 18h28v28H18z" fill="#ef4444" />
  <path d="M24 24h16v16H24z" fill="#111827" />
</svg>
`.trim();

export function GET() {
  const response = new NextResponse(faviconSvg);
  response.headers.set('Content-Type', 'image/svg+xml');
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return response;
}
