import { NextResponse } from "next/server";
import { connectMongoDB } from "../../../../../models/mongodb";
import Event from "../../../../../lib/Event";

/* ===== UPDATE EVENT ===== */
export async function PATCH(req, context) {
  await connectMongoDB();

  const { id } = await context.params; // ✅ สำคัญมาก
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

/* ===== DELETE EVENT (SOFT DELETE) ===== */
export async function DELETE(req, context) {
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
