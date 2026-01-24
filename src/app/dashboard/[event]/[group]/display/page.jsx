"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function DisplayPage() {
  const { group } = useParams();

  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [showImage, setShowImage] = useState(false);

  // โหลดรูป
  useEffect(() => {
    fetch(`/api/groups/${group}/images`)
      .then(res => res.json())
      .then((data) => {
        setImages(data);
        setIndex(0);
      })
      .catch(console.error);
  }, [group]);

  // เปลี่ยนภาพตาม duration
  useEffect(() => {
    if (!images.length) return;

    const duration = (images[index]?.duration || 3) * 1000;
    const timer = setTimeout(() => {
      setShowImage(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % images.length);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [index, images]);

  // ทุกครั้งที่เปลี่ยน index → fade in ใหม่
  useEffect(() => {
    if (!images.length) return;
    const t = setTimeout(() => setShowImage(true), 50);
    return () => clearTimeout(t);
  }, [index, images]);

  if (!images.length) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        No images
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div
        className={`
          relative w-full h-full
          transition-opacity duration-700 ease-in-out
          ${showImage ? "opacity-100" : "opacity-0"}
        `}
      >
        <Image
          src={images[index].url}
          alt=""
          fill
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
