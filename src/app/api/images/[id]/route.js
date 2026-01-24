import { NextResponse } from "next/server";
import mongoose from "mongoose";
import cloudinary from "../../../../../lib/cloudinary";
import { connectMongoDB } from "../../../../../models/mongodb";
import Image from "../../../../../lib/Image";

// แก้ไขรูป / duration
export async function PATCH(req, { params }) {
  await connectMongoDB();

  const { id: imageId } = await params;

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return NextResponse.json(
      { error: "Invalid image id" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const duration = formData.get("duration");

  const image = await Image.findById(imageId);
  if (!image) {
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 }
    );
  }

  /* เปลี่ยนรูป */
  if (file) {
    // ลบรูปเก่าจาก cloudinary
    if (image.cloudinaryId) {
      await cloudinary.uploader.destroy(image.cloudinaryId);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "images" },
        (err, res) => (err ? reject(err) : resolve(res))
      ).end(buffer);
    });

    image.cloudinaryId = result.public_id;
    image.url = result.secure_url;
  }

  /* แก้ duration */
  if (duration) {
    image.duration = Number(duration);
  }

  await image.save();

  return NextResponse.json(image);
}

// ลบรูป
export async function DELETE(req, { params }) {
  await connectMongoDB();

  const { id: imageId } = await params;

  const image = await Image.findById(imageId);
  if (!image) {
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 }
    );
  }

  if (image.cloudinaryId) {
    await cloudinary.uploader.destroy(image.cloudinaryId);
  }

  await Image.findByIdAndDelete(imageId);

  return NextResponse.json({ success: true });
}
