"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { PencilSquareIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { Interactive3DLogo } from "~~/components/Interactive3DLogo";

const Home: NextPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <div className="flex justify-center mb-6">
            <div className="w-80 h-80">
              <Interactive3DLogo size={320} />
            </div>
          </div>
          <h1 className="text-center text-base-content">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">DeBu Studio</span>
          </h1>
          <p className="text-center text-lg mt-4 max-w-2xl mx-auto text-base-content/80">
            The Decentralized Bureaucracy Studio. Design, deploy, and execute standardized processes on-chain.
          </p>

          {/* Action Buttons - Centered below text */}
          <div className="flex justify-center items-center gap-12 mt-12 flex-col sm:flex-row">
            {/* Design Process Button */}
            <Link
              href="/design"
              className="btn btn-primary btn-xl gap-6 rounded-full hover:scale-105 transition-transform text-2xl px-12 py-8"
            >
              <PencilSquareIcon className="h-12 w-12" />
              <span>Design</span>
            </Link>

            {/* Browse Processes Button */}
            <Link
              href="/browse"
              className="btn btn-primary btn-xl gap-6 rounded-full hover:scale-105 transition-transform text-2xl px-12 py-8"
            >
              <RectangleStackIcon className="h-12 w-12" />
              <span>Browse</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
