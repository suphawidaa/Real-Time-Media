import { NextResponse } from "next/server";
import Event from "../../../../lib/Event";
import { connectMongoDB } from "../../../../models/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  await connectMongoDB();
  const events = await Event.find({ isActive: true }).sort({ createdAt: -1 });
  return NextResponse.json(events);
}

export async function POST(req) {
  await connectMongoDB();
  const session = await getServerSession(authOptions);
  const body = await req.json();

  const event = await Event.create({
    name: body.name,
    slug: body.slug,
    owner: session.user.id,
  });

  return NextResponse.json(event);
}
