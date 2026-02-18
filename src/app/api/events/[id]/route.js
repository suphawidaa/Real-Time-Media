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

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Event ID missing" },
      { status: 400 }
    );
  }

  // 🗑️ เปลี่ยนจากอัปเดต isActive เป็นลบทิ้งจริงๆ
  const deletedEvent = await Event.findByIdAndDelete(id);

  if (!deletedEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
