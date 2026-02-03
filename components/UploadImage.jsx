"use client";
import { useState } from "react";
import { FiX } from "react-icons/fi";

export default function UploadPopup({ isOpen, onClose, onUpload }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFilesChange = async (e) => {
    const resized = await Promise.all(
      Array.from(e.target.files).map(async (file) => {
        const resizedFile = await resizeImage(file);
        return {
          file: resizedFile,
          preview: URL.createObjectURL(resizedFile),
          id: Date.now() + Math.random(),
        };
      })
    );

    setFiles((prev) => [...prev, ...resized]);
  };
  const resizeImage = (file, maxSize = 1600, quality = 0.8) =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        let { width, height } = img;

        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
    });

  const handleRemoveFile = (id) => {
  setFiles((prev) => {
    const file = prev.find((f) => f.id === id);
    if (file) URL.revokeObjectURL(file.preview);
    return prev.filter((f) => f.id !== id);
  });
};

  const handleUpload = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await onUpload(files);
      setFiles([]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();

    const resized = await Promise.all(
      Array.from(e.dataTransfer.files).map(async (file) => {
        const resizedFile = await resizeImage(file);
        return {
          file: resizedFile,
          preview: URL.createObjectURL(resizedFile),
          id: Date.now() + Math.random(),
        };
      })
    );

    setFiles((prev) => [...prev, ...resized]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-11/12 max-w-3xl relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-gray-200 rounded-full"
        >
          <FiX />
        </button>

        <h2 className="text-lg font-bold mb-4 text-center">Upload Images</h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-gray-400 border-dashed rounded p-8 text-center mb-4"
        >
          <p className="font-medium">Drag & drop images here</p>
          <label className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
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
          <div className="grid sm:grid-cols-3 gap-3 max-h-80 overflow-auto mb-4">
            {files.map((f) => (
              <div key={f.id} className="relative">
                <div className="relative rounded overflow-hidden bg-black">
                  <img
                    src={f.preview}
                    alt=""
                    className="w-full h-auto object-contain"
                  />
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
            disabled={loading || files.length === 0}
            className="
            px-6 py-2 rounded text-white
            bg-blue-700
            disabled:bg-blue-400
            disabled:cursor-not-allowed"
          >
            {loading ? "Uploading images..." : "Upload Images"}
          </button>
        </div>
      </div>
    </div>
  );
}