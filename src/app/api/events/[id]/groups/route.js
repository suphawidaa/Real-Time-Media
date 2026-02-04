export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Group from "../../../../../../lib/Group";
import Image from "../../../../../../lib/Image";
import { connectMongoDB } from "../../../../../../models/mongodb";
import crypto from "crypto";
import { requireAuth } from "../../../../../../lib/requireAuth";

/* ================= GET groups ================= */
export async function GET(req, { params }) {
  await connectMongoDB();

  const { id } = await params;

  // ✅ ป้องกัน id ผิด
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json([], { status: 200 });
  }

  const groups = await Group.find({ event: id })
    .sort({ order: 1 })
    .lean();

  const groupsWithImageCount = await Promise.all(
    groups.map(async (group) => {
      const imageCount = await Image.countDocuments({
        group: group._id,
        isActive: true,
      });

      return {
        ...group,
        imageCount,
      };
    })
  );

  return NextResponse.json(groupsWithImageCount);
}

/* ================= CREATE group ================= */
export async function POST(req, { params }) {
  const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  try {
    await connectMongoDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid Event ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const count = await Group.countDocuments({ event: id });

    const group = await Group.create({
      name: body.name,
      slug: body.slug,
      event: id, // ✅ mongoose แปลงให้เองได้
      publicKey: crypto.randomUUID(),
      order: count,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("GROUP CREATE ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
