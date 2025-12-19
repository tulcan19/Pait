"use client";

<<<<<<< Updated upstream
import React from "react";
import Navbar from "@/src/app/(components)/Navbar";
=======
import React, { useEffect } from "react";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }
  });
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
export default DashboardWrapper;
=======
const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </StoreProvider>
  );
};

export default DashboardWrapper;
>>>>>>> Stashed changes
