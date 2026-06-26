import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect('https://projectrollinggiant.movieslay.com', 308);
}
