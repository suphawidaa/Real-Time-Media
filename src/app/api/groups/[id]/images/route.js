export const runtime = "nodejs";

import { NextResponse } from "next/server";
import cloudinary from "../../../../../../lib/cloudinary";
import { connectMongoDB } from "../../../../../../models/mongodb";
import Image from "../../../../../../lib/Image";
import Group from "../../../../../../lib/Group";
import { requireAuth } from "../../../../../../lib/requireAuth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export async function GET(req, { params }) {
  await connectMongoDB();

  const { id: slug } = await params;

  const group = await Group.findOne({ slug });
  if (!group) {
    return NextResponse.json([], { status: 200 });
  }

  const images = await Image.find({
    group: group._id,
    isActive: true,
  }).sort({ order: 1, createdAt: 1 });

  return NextResponse.json(images);
}

export async function POST(req, { params }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const { id: slug } = await params;
  const group = await Group.findOne({ slug });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files");
  const duration = Number(formData.get("duration") || 5);

  const uploadedImages = [];

  let orderIndex = await Image.countDocuments({
  group: group._id,
  isActive: true,
});

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          transformation: [
            { width: 1920, crop: "limit", quality: "auto" },
          ],
        },
        (err, res) => (err ? reject(err) : resolve(res))
      ).end(buffer);
    });

    const savedImage = await Image.create({
      group: group._id,
      cloudinaryId: result.public_id,
      url: result.secure_url,
      duration,
      order: orderIndex,
    });
    orderIndex++;
    uploadedImages.push(savedImage);

    // 🔥 EMIT REALTIME
    await fetch(`${SOCKET_URL}/emit`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "new-image",
    groupId: slug,
    image: {
      _id: savedImage._id,
      url: savedImage.url,
      duration: savedImage.duration,
    },
  }),
});

  }
  return NextResponse.json(uploadedImages, { status: 201 });
}

export async function PATCH(req, { params }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const { id: slug } = await params;
  const { duration } = await req.json();

  if (!duration || Number(duration) < 1) {
    return NextResponse.json(
      { error: "Duration is required" },
      { status: 400 }
    );
  }

  const group = await Group.findOne({ slug });
  if (!group) {
    return NextResponse.json(
      { error: "Group not found" },
      { status: 404 }
    );
  }

  // ✅ 1) UPDATE DB ก่อน
  await Image.updateMany(
    { group: group._id },
    { $set: { duration: Number(duration) } }
  );

  // ✅ 2) ยิง realtime (optional)
  await fetch(`${SOCKET_URL}/emit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "update-duration",
      groupId: slug,
      duration: Number(duration),
    }),
  });

  return NextResponse.json({ success: true });
}
