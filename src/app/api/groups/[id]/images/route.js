import { NextResponse } from "next/server";
import mongoose from "mongoose";
import cloudinary from "../../../../../../lib/cloudinary";
import { connectMongoDB } from "../../../../../../models/mongodb";
import Image from "../../../../../../lib/Image";
import Group from "../../../../../../lib/Group";

export async function GET(req, { params }) {
  await connectMongoDB();

  const { id: slug } = await params; // ✅ id = slug

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

/* ================= POST ================= */
export async function POST(req, { params }) {
  await connectMongoDB();

  const { id: slug } = await params;

  const group = await Group.findOne({ slug });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files");
  const duration = Number(formData.get("duration") || 5);

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  // ✅ upload + resize พร้อมกัน
  const uploadedImages = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `groups/${slug}`,

            // ⭐ สำคัญมาก
            transformation: [
              {
                width: 1920,        // เหมาะกับ TV
                crop: "limit",      // ไม่ขยายรูปเล็ก
                quality: "auto",    // Cloudinary เลือกให้ดีที่สุด
                fetch_format: "auto", // webp / jpg อัตโนมัติ
              },
            ],
          },
          (err, res) => (err ? reject(err) : resolve(res))
        ).end(buffer);
      });

      return Image.create({
        group: group._id,
        cloudinaryId: result.public_id,
        url: result.secure_url,
        duration,
      });
    })
  );

  return NextResponse.json(uploadedImages, { status: 201 });
}


export async function PATCH(req, { params }) {
  await connectMongoDB();

  const { id: slug } = await params;
  const { duration } = await req.json();

  if (!duration) {
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

  await Image.updateMany(
    { group: group._id },
    { $set: { duration: Number(duration) } }
  );

  return NextResponse.json({ success: true });
}
