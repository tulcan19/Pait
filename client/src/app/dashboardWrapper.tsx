"use client";

import React from "react";
import Navbar from "@/src/app/(components)/Navbar";

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`flex bg-gray-50 text-gray-900 w-full min-h-screen`}>
      <aside className={`w-64 bg-gray-900 text-white p-4`}>
        Sidebar
      </aside>
      <main className={`flex flex-col w-full h-full py-7 px-9 bg-gray-50`}>
        <Navbar />
        {children}
      </main>
    </div>
  );
};

export default DashboardWrapper;