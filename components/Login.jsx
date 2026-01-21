'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res.error) {
      if (res.error === "USERNAME_NOT_FOUND") {
        setError("ไม่พบชื่อผู้ใช้นี้ในระบบ");
      } else if (res.error === "WRONG_PASSWORD") {
        setError("รหัสผ่านไม่ถูกต้อง");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-[#B5D2EF] to-[#064E85] flex items-center justify-center">
      <div className="w-[800] h-[480] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        <div className="w-[45%] bg-[#064E85] px-10 py-16 rounded-tr-[150px] flex flex-col justify-center items-center text-white">
          <h2 className="text-3xl font-semibold mb-3">
            Hello, Welcome!
          </h2>
          <p className="text-lg text-center">
            Real-time Media Display System
          </p>
        </div>

        <div className="w-[55%] flex items-center justify-center">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm px-10 text-center"
          >
            <h2 className="text-2xl font-bold mb-8 text-[#002589]">
              Login
            </h2>

            <div className="relative mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-gray-100 py-3 px-4 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              />
              <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>

            <div className="relative mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-gray-100 py-3 px-4 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              />
              <FaLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>

            {error && (
              <div className="text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#064E85] text-white py-3 rounded-lg font-medium hover:bg-[#3071b3] transition disabled:opacity-50"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
