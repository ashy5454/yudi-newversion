import { NextRequest, NextResponse } from "next/server";
import { APIResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse<APIResponse>> {
    return NextResponse.json({ message: 'API is working' });
}

export async function POST(req: NextRequest): Promise<NextResponse<APIResponse>> {
    // Voice calls are handled client-side via Gemini Live API
    return NextResponse.json({ message: 'Voice call initiated' });
}
