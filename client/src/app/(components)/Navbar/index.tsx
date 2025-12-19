// ...existing code...
"use client";

<<<<<<< Updated upstream
import { Bell, Menu, Sun, Settings } from "lucide-react";
=======
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { Bell, Menu, Moon, Settings, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
>>>>>>> Stashed changes
import React from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center w-full mb-7">
      {/* LEFT SIDE */}
      <div className="flex justify-between items-center gap-5">
        <button
          className="px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
          onClick={() => {}}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="relative">
        <input
          type="search"
          placeholder="Comience a escribir para buscar grupos y productos"
          className="pl-10 pr-4 py-2 w-48 md:w-80 border border-gray-300 bg-white rounded-lg outline-none focus:border-blue-500"
        />

        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Bell className="text-gray-500" size={20} />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex justify-between items-center gap-5">
        <div className="hidden md:flex justify-between items-center gap-5">
          <div>
            <button onClick={() => {}} aria-label="Toggle theme">
              <Sun className="cursor-pointer text-gray-500" size={24} />
            </button>
          </div>
          <div className="relative">
            <Bell className="cursor-pointer text-gray-500" size={24} />
            <span className="absolute -top-2 right-2 inline-flex items-center justify-center px-[0.4rem] py-1 text-xs font-semibold leading-none text-white bg-red-400 rounded-full">
              3
            </span>
          </div>
          <hr className="w-0 h-7 border-solid border-l border-gray-300 mx-3" />
          <div className="flex items-center gap-3 cursor-pointer">
<<<<<<< Updated upstream
            <div className="w-9 h-9">imagen</div>
            <span className="font-semibold">Javier Tulcan</span>
=======
            <Image
              src="https://s3-inventorymanagement.s3.us-east-2.amazonaws.com/profile.jpg"
              alt="Profile"
              width={50}
              height={50}
              className="rounded-full h-full object-cover"
            />
            <span className="font-semibold">Javier Tulcán</span>
>>>>>>> Stashed changes
          </div>
        </div>

        <Link href="/settings" aria-label="Settings">
          <Settings className="cursor-pointer text-gray-500" size={24} />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
<<<<<<< Updated upstream
// ...existing code...
=======
>>>>>>> Stashed changes
