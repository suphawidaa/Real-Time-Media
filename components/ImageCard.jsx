"use client";
import { useState } from "react";
import Image from "next/image";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin5Fill } from "react-icons/ri";

export default function ImageCard({ img, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editDuration, setEditDuration] = useState(img.duration);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  const isVideo =
    img.type === "video" ||
    img.url?.includes("/video/") ||
    img.url?.endsWith(".mp4");

  const handleSave = async () => {
    setSaving(true);

    const fd = new FormData();
    if (editFile) fd.append("file", editFile);
    fd.append("duration", editDuration);

    const res = await fetch(`/api/images/${img._id}`, {
      method: "PATCH",
      body: fd,
    });

    const updated = await res.json();

    if (res.ok) {
      onUpdate(updated);
      setEditing(false);
      setEditFile(null);
      setEditPreview(null);
    }

    setSaving(false);
  };

  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="relative bg-white flex justify-center">

        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-[12px] font-bold flex items-center gap-1 shadow-lg border border-white/20">
          {isVideo ? (
            <>
              <span className="text-[10px] opacity-80">SEC:</span>
              {formatTime(videoDuration)}
            </>
          ) : (
            <>
              <span className="text-[10px] opacity-80">SEC:</span>
              {img.duration}
            </>
          )}
        </div>

        {/* Preview */}
        {(isVideo ||
          (editFile && editFile.type?.startsWith("video/"))) ? (
          <video
            src={editPreview || img.url}
            controls
            className={`object-contain transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"
              }`}
            onLoadedData={(e) => {
              setLoaded(true);
              setVideoDuration(e.target.duration);
            }}
          />

        ) : (
          <Image
            src={editPreview || img.url}
            alt=""
            width={600}
            height={600}
            className={`object-contain transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"
              }`}
            onLoad={() => setLoaded(true)}
          />
        )}

      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-4 text-sm">
        <button
          onClick={() => {
            setEditing(true);

            if (isVideo && videoDuration) {
              setEditDuration(Math.floor(videoDuration));
            } else {
              setEditDuration(img.duration);
            }
          }}

          className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
        >
          <MdEdit className="text-lg group-hover:rotate-6 transition" />
          Edit
        </button>

        <button
          onClick={() => onDelete(img._id)}
          className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
        >
          <RiDeleteBin5Fill className="text-lg group-hover:scale-110 transition" />
          Delete
        </button>
      </div>

      {/* Edit Panel */}
      <div
        className={`mt-4 rounded-2xl border-2 border-dashed border-gray-300 p-5 space-y-5 transition-all duration-300 ease-out ${editing
          ? "opacity-100 translate-y-0 max-h-[500px]"
          : "opacity-0 -translate-y-3 max-h-0 overflow-hidden pointer-events-none"
          }`}
      >
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Replace :
          </label>

          <label className="col-span-2 relative flex justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer transition">
            <input
              type="file"
              accept="image/*,video/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                setEditFile(file);
                setEditPreview(URL.createObjectURL(file));
                setLoaded(false);
              }}
            />
            Choose file
          </label>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Duration (s) :
          </label>
          <input
            type="number"
            min="1"
            value={editDuration}
            onChange={(e) => setEditDuration(e.target.value)}
            className="col-span-2 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setEditing(false);
              setEditFile(null);
              setEditPreview(null);
              setEditDuration(img.duration);
            }}
            className="w-1/2 border rounded-xl py-2 text-sm hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-1/2 rounded-xl py-2 text-sm text-white transition ${saving
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#001D75] hover:bg-blue-800"
              }`}
          >
            {saving ? "Saving..." : "Save change"}
          </button>
        </div>
      </div>
    </div>
  );
}
