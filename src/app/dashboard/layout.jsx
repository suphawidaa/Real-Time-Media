"use client";

import Sidebar from "../../../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <Sidebar>
      {children}
    </Sidebar>
  );
}
