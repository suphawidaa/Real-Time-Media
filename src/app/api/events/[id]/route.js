export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectMongoDB } from "../../../../../models/mongodb";
import Event from "../../../../../lib/Event";
import { requireAuth } from "../../../../../lib/requireAuth";

/*  UPDATE EVENT */
export async function PATCH(req, context) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const { id } = await context.params;
  const { name, slug } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Event ID missing" },
      { status: 400 }
    );
  }

  const event = await Event.findByIdAndUpdate(
    id,
    { name, slug },
    { new: true }
  );

  return NextResponse.json(event);
}

/* DELETE EVENT */
export async function DELETE(req, context) {
  const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  await connectMongoDB();

  const { id } = await context.params; // ✅ ต้อง await

  if (!id) {
    return NextResponse.json(
      { error: "Event ID missing" },
      { status: 400 }
    );
  }

  await Event.findByIdAndUpdate(id, { isActive: false });

  return NextResponse.json({ success: true });
}
