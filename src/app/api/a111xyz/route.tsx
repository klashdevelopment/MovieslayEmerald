import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    return NextResponse.json({ sources: [], error: "Permission from a.111___.xyz owner has not been granted" })
}