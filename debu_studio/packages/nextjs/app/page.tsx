"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PencilSquareIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { Interactive3DLogo } from "~~/components/Interactive3DLogo";

const Home: NextPage = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Dark mode colors (default)
  const darkSectionBg = "#27C8F5";
  const darkCardBg = "#0f172a";
  const darkCardText = "text-white";

  // Light mode colors (inverted)
  const lightSectionBg = "#2A3F5F"; // Dark blue/gray for section
  const lightCardBg = "#E8F4F8"; // Very light cyan for cards
  const lightCardText = "text-gray-900";

  const sectionBg = theme === "light" ? lightSectionBg : darkSectionBg;
  const cardBg = theme === "light" ? lightCardBg : darkCardBg;
  const cardText = theme === "light" ? lightCardText : darkCardText;

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <div className="flex justify-center mb-6">
            <div className="w-80 h-80">
              <Interactive3DLogo size={320} />
            </div>
          </div>
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">DeBu Studio</span>
          </h1>
          <p className="text-center text-lg mt-4 max-w-2xl">
            The Decentralized Bureaucracy Studio. Design, deploy, and execute standardized processes on-chain.
          </p>
        </div>

        <div className="grow w-full mt-16 px-8 py-12" style={{ backgroundColor: sectionBg }}>
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className={`flex flex-col px-10 py-10 text-center items-center max-w-xs rounded-3xl hover:shadow-lg transition-shadow ${cardText}`} style={{ backgroundColor: cardBg }}>
              <PencilSquareIcon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Design Process</h3>
              <p className="mb-4">
                Create new process blueprints with custom steps and logic.
              </p>
              <Link href="/design" className="btn btn-primary btn-sm">
                Go to Design
              </Link>
            </div>
            
            <div className={`flex flex-col px-10 py-10 text-center items-center max-w-xs rounded-3xl hover:shadow-lg transition-shadow ${cardText}`} style={{ backgroundColor: cardBg }}>
              <RectangleStackIcon className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-xl font-bold mb-2">Browse Processes</h3>
              <p className="mb-4">
                Explore and instantiate existing process templates.
              </p>
              <Link href="/browse" className="btn btn-secondary btn-sm">
                Go to Browse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
