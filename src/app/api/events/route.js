export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Event from "../../../../lib/Event";
import { connectMongoDB } from "../../../../models/mongodb";
import { requireAuth } from "../../../../lib/requireAuth";

export async function GET() {
  await connectMongoDB();
  const events = await Event.find({ isActive: true }).sort({ createdAt: -1 });
  return NextResponse.json(events);
}

export async function POST(req) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const body = await req.json();

  const event = await Event.create({
    name: body.name,
    slug: body.slug,
    owner: session.user.id,
  });
  

  return NextResponse.json(event);
}
