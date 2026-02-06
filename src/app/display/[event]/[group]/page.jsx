"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export default function DisplayPage() {
  const { group: groupId } = useParams();
  const [fetching, setFetching] = useState(true);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);

  /* โหลดรูปครั้งแรก */
  useEffect(() => {
    if (!groupId) return;

    fetch(`/api/groups/${groupId}/images`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.length) return;

        const first = data[0];
        setImages(data);
        setIndex(0);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [groupId]);

  /* socket realtime */
  useEffect(() => {
    if (!groupId) return;

    if (socketRef.current) {
      socketRef.current.emit("join-group", groupId);
      return;
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected:", socket.id);
      socket.emit("join-group", groupId);
    });

    socket.on("new-image", (img) => {
      setImages((prev) => [...prev, img]);
    });

    socket.on("delete-image", (imageId) => {
      setImages((prev) => {
        const next = prev.filter((img) => img._id !== imageId);
        setIndex((i) => (next.length ? i % next.length : 0));
        return next;
      });
    });

    socket.on("update-image", (updated) => {
      setImages((prev) =>
        prev.map((img) =>
          img._id === updated._id ? { ...img, ...updated } : img
        )
      );
    });

    socket.on("update-duration", (duration) => {
      setImages((prev) =>
        prev.map((img) => ({ ...img, duration }))
      );
    });

  }, [groupId]);

  /* slideshow */
  useEffect(() => {
    if (!images.length) return;
    if (images.length === 1) {
      clearTimeout(timerRef.current);
      return;
    }
    clearTimeout(timerRef.current);

    const duration = (images[index]?.duration || 5) * 1000;

    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % images.length);
    }, duration);

    return () => clearTimeout(timerRef.current);
  }, [index, images]);

  if (fetching) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white">
        <div className="text-3xl md:text-4xl font-semibold mb-3">
          ไม่พบข้อมูลรูปภาพ
        </div>
        <div className="text-base md:text-lg text-gray-400">
          กรุณารอผู้ดูแลระบบอัปโหลดสื่อภาพ
        </div>
      </div>
    );
  }

  const currentImage = images[index];

  return (
    <div className="fixed inset-0 bg-black">
      <div className="relative w-full h-full">

        <Image
          key={`${currentImage._id}-${currentImage.updatedAt}`}
          src={`${currentImage.url}?v=${currentImage.updatedAt}`}
          alt=""
          fill
          unoptimized
          className="object-cover tv-fade tv-image"
        />
      </div>
    </div>
  );
}
