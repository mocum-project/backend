import { NextRequest, NextResponse } from 'next/server';

export default function middleware(req: NextRequest) {
  // console.log(req.headers.set('origin','');
  return NextResponse.next();
}
