export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import cloudinary from "../../../../../lib/cloudinary";
import { connectMongoDB } from "../../../../../models/mongodb";
import Image from "../../../../../lib/Image";
import { requireAuth } from "../../../../../lib/requireAuth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

// แก้ไขรูป / duration
export async function PATCH(req, { params }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const { id: imageId } = await params;

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const duration = formData.get("duration");

  const image = await Image.findById(imageId).populate("group");
  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  /* 🖼️ เปลี่ยนรูป */
  if (file) {
    // 🔥 ลบรูปเก่าจาก Cloudinary
    if (image.cloudinaryId) {
      await cloudinary.uploader.destroy(image.cloudinaryId);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "images",
          public_id: `image_${Date.now()}`, // 👈 NEW public_id ทุกครั้ง
          overwrite: false, // ปลอดภัย
        },
        (err, res) => (err ? reject(err) : resolve(res))
      ).end(buffer);
    });

    image.cloudinaryId = result.public_id;
    image.url = result.secure_url;
  }

  /* ⏱️ แก้ duration */
  if (duration !== null) {
    image.duration = Number(duration);
  }

  await image.save();

// 🔥 ดึงข้อมูลใหม่ (ให้ updatedAt ใหม่จริง)
const freshImage = await Image
  .findById(image._id)
  .lean();

await fetch(`${SOCKET_URL}/emit`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "update-image",
    groupId: image.group.slug,
    image: freshImage, // 👈 ส่งทั้ง object
  }),
});

return NextResponse.json(freshImage);
}


// ลบรูป
export async function DELETE(req, { params }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongoDB();

  const { id: imageId } = await params;

  const image = await Image.findById(imageId).populate("group");
  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const groupSlug = image.group.slug;

  if (image.cloudinaryId) {
    await cloudinary.uploader.destroy(image.cloudinaryId);
  }

  await Image.findByIdAndDelete(imageId);

  // 🔥 EMIT DELETE REALTIME
  await fetch(`${SOCKET_URL}/emit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "delete-image",
      groupId: groupSlug,
      imageId,
    }),
  });

  return NextResponse.json({ success: true });
}
