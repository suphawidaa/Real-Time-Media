export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "../../../../../../../models/mongodb";
import Group from "../../../../../../../lib/Group";
import { requireAuth } from "../../../../../../../lib/requireAuth";

export async function PATCH(req, { params }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const { id: eventId, groupId } = await params;
  const { name, slug } = await req.json();

  if (
    !mongoose.Types.ObjectId.isValid(eventId) ||
    !mongoose.Types.ObjectId.isValid(groupId)
  ) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const updated = await Group.findOneAndUpdate(
    { _id: groupId, event: eventId },
    { name, slug },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Group not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}
export async function DELETE(req, { params }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const { id: eventId, groupId } = await params;

  // ป้องกัน id เพี้ยน
  if (
    !mongoose.Types.ObjectId.isValid(eventId) ||
    !mongoose.Types.ObjectId.isValid(groupId)
  ) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  // ลบเฉพาะ group ที่อยู่ใน event นี้
  await Group.deleteOne({
  _id: groupId,
  event: eventId,
});


  return NextResponse.json({ success: true });
}
