"use client";
import { useState, useEffect } from "react";
import { FiUpload } from "react-icons/fi";
import { useParams } from "next/navigation";
import UploadPopup from "../../../../../components/UploadImage";
import ImageCard from "../../../../../components/ImageCard";

export default function GroupPage() {

  const [images, setImages] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [globalDuration, setGlobalDuration] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { group } = useParams();
  const groupId = group;

  /* โหลดรูปจาก DB */
  useEffect(() => {
    if (!groupId) return;

    fetch(`/api/groups/${groupId}/images`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setImages(data);

          // 🔥 ตั้งค่า duration จากรูปแรก
          if (data.length > 0 && data[0].duration) {
            setGlobalDuration(data[0].duration);
          }
        } else {
          setImages([]);
        }
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [groupId]);

  return (
    <div className="w-full p-4">
      <div className="flex justify-end mb-6">
        <div className="flex flex-wrap justify-end items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              duration (s)
            </label>

            <input
              type="number"
              min="1"
              value={globalDuration ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setGlobalDuration(value === "" ? null : Number(value));
              }}
              className="border px-3 py-1 rounded w-20 border-gray-500"
            />

            <button
              disabled={saving || !globalDuration}
              onClick={async () => {
                setSaving(true);

                const res = await fetch(`/api/groups/${groupId}/images`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ duration: globalDuration }),
                });

                if (res.ok) {
                  setImages((prev) =>
                    prev.map((img) => ({
                      ...img,
                      duration: Number(globalDuration),
                    }))
                  );
                }

                setSaving(false);
              }}
              className={`text-sm font-medium px-3 py-2 rounded transition
    ${saving
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gray-800 text-white hover:bg-black"
                }`}
            >
              {saving ? "Saving..." : "Apply to all"}
            </button>

          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <FiUpload /> Upload Images
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400">
            Loading...
          </div>
        ) : images.length > 0 ? (
          images.map((img) => (
            <ImageCard
              key={img._id}
              img={img}
              onDelete={async (id) => {
                await fetch(`/api/images/${id}`, { method: "DELETE" });
                setImages((prev) => prev.filter((i) => i._id !== id));
              }}
              onUpdate={(updated) => {
                setImages((prev) =>
                  prev.map((i) =>
                    i._id === updated._id ? updated : i
                  )
                );
              }}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400">
            No images
          </div>
        )}
      </div>

      <UploadPopup
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={async (files) => {
          const fd = new FormData();
          files.forEach((f) => fd.append("files", f.file));
          fd.append("duration", globalDuration || 3);


          const res = await fetch(`/api/groups/${groupId}/images`, {
            method: "POST",
            body: fd,
          });

          const data = await res.json();
          if (res.ok) setImages((prev) => [...prev, ...data]);

          if (globalDuration === null && data.length > 0) {
            setGlobalDuration(data[0].duration);
          }

        }}
      />
    </div>
  );
}