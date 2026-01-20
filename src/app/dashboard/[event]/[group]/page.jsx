"use client";
import { useState, useEffect, useRef } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin5Fill } from "react-icons/ri";
import Image from "next/image";
import { useParams } from "next/navigation";

/* Upload Popup */
function UploadPopup({ isOpen, onClose, onUpload }) {
  const [files, setFiles] = useState([]);

  if (!isOpen) return null;

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
      duration: 5,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    await onUpload(files); // ⬅️ รอ upload จริง
    setFiles([]);
    onClose();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
      duration: 5,
    }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-11/12 max-w-3xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200"
        >
          <FiX />
        </button>

        <h2 className="text-lg font-bold mb-4 text-center">Upload Images</h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-400 rounded p-8 text-center cursor-pointer mb-4"
        >
          <p className="font-medium">Drag & drop images here, or</p>
          <label className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
            Choose files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-80 overflow-auto mb-4">
            {files.map((f) => (
              <div key={f.id} className="relative p-2">
                <div className="relative w-full aspect-video rounded overflow-hidden">
                  <Image src={f.preview} alt="preview" fill className="object-cover" />
                </div>
                <button
                  onClick={() => handleRemoveFile(f.id)}
                  className="absolute top-2 right-2 bg-white/80 rounded-full p-1"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-blue-700 text-white rounded"
          >
            Upload Images
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= GROUP PAGE ================= */
export default function GroupPage() {

  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const { group } = useParams();
  const groupId = group;
  const [editFile, setEditFile] = useState(null);
  const [editDuration, setEditDuration] = useState(5);
  const [editPreview, setEditPreview] = useState(null);

  /* โหลดรูปจาก DB */
  useEffect(() => {
    if (!groupId) return;

    fetch(`/api/groups/${groupId}/images`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setImages(data);
        } else {
          console.error("Images API error:", data);
          setImages([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setImages([]);
      });
  }, [groupId]);

  const removeImage = async (id) => {
    await fetch(`/api/images/${id}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img._id !== id));
  };

  const [globalDuration, setGlobalDuration] = useState(3);
  const [saving, setSaving] = useState(false);

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
              value={globalDuration}
              onChange={(e) => setGlobalDuration(e.target.value)}
              className="border px-3 py-1 rounded w-20 border-gray-500"
            />

            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);

                const res = await fetch(
                  `/api/groups/${groupId}/images`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      duration: globalDuration,
                    }),
                  }
                );

                if (res.ok) {
                  // อัปเดต state ทุกภาพในหน้า
                  setImages((prev) =>
                    prev.map((img) => ({
                      ...img,
                      duration: Number(globalDuration),
                    }))
                  );
                }
                setSaving(false);
              }}
              className="text-sm font-medium px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-gray-800"
            >
              Apply to all
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
        {images.length > 0 ? (
          images.map((img) => (
            <div key={img._id} className="bg-white rounded-xl shadow p-4">

              {/* รูป */}
              <div className="relative aspect-video rounded overflow-hidden mb-3">
                <Image
                  src={editPreview || img.url}
                  fill
                  className="object-cover"
                  alt=""
                />
              </div>

              {/* ปุ่ม */}
              <div className="flex justify-between mt-4 text-sm">
                <button
                  onClick={() => {
                    setEditingId(img._id);
                    setEditDuration(img.duration);
                    setEditFile(null);
                    setEditPreview(null);
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-200 rounded"
                >
                  <MdEdit /> Edit
                </button>

                <button
                  onClick={() => removeImage(img._id)}
                  className="flex items-center gap-1 px-2 py-2 bg-red-100 text-red-600 rounded"
                >
                  <RiDeleteBin5Fill /> Delete
                </button>
              </div>

              {editingId === img._id && (
                <div className="mt-4 rounded-2xl border-gray-300 p-5 space-y-5 border-2 border-dashed">
                  <div className="space-y-4">

                    {/* Replace */}
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">
                        Replace :
                      </label>

                      <label className="relative col-span-2 flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 bg-blue-500 hover:bg-blue-600 cursor-pointer transition">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setEditFile(file);
                            setEditPreview(URL.createObjectURL(file));
                          }}
                        />
                        <span className="text-sm font-medium text-white">
                          Choose file
                        </span>
                      </label>
                    </div>

                    {/* Duration */}
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">
                        Duration (s) :
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* ===== Actions ===== */}
                  <div className="flex gap-3 pt-2">
                    <button
                      className="w-1/2 rounded-xl border border-gray-300 py-2 text-sm font-medium hover:bg-gray-100 transition"
                      onClick={() => {
                        setEditingId(null);
                        setEditFile(null);
                        setEditPreview(null);
                        setEditDuration(img.duration);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      className="w-1/2 rounded-xl bg-[#001D75] py-2 text-sm font-medium text-white hover:bg-blue-800 transition"
                      onClick={async () => {
                        const fd = new FormData();
                        if (editFile) fd.append("file", editFile);
                        fd.append("duration", editDuration);

                        const res = await fetch(`/api/images/${img._id}`, {
                          method: "PATCH",
                          body: fd,
                        });

                        const updated = await res.json();

                        if (res.ok) {
                          setImages((prev) =>
                            prev.map((i) => (i._id === updated._id ? updated : i))
                          );
                          setEditingId(null);
                          setEditPreview(null);
                          setEditFile(null);
                        }
                      }}
                    >
                      Save change
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))

        ) : (
          <div className="col-span-full text-center text-gray-400">
            
          </div>
        )}
      </div>

      <UploadPopup
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={async (files) => {
          const formData = new FormData();

          files.forEach((f) => {
            formData.append("files", f.file);
          });

          formData.append("duration", 3);

          const res = await fetch(`/api/groups/${groupId}/images`, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (res.ok && Array.isArray(data)) {
            setImages((prev) => [...prev, ...data]);
          } else {
            console.error("Upload error:", data);
          }
        }}
      />
    </div>
  );
}
