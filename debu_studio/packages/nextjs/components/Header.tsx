"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon, PencilSquareIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

const processSteps = [
  { label: "Design", href: "/design" },
  { label: "Browse", href: "/browse" },
  { label: "Execute", href: "/execute" },
];

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Design",
    href: "/design",
    icon: <PencilSquareIcon className="h-4 w-4" />,
  },
  {
    label: "Browse",
    href: "/browse",
    icon: <RectangleStackIcon className="h-4 w-4" />,
  },
  {
    label: "Execute",
    href: "/execute",
    icon: <Bars3Icon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

const ProcessNavBar = () => {
  const pathname = usePathname();

  return (
    <div className="flex gap-0 w-96">
      {processSteps.map((step, index) => {
        const isActive = pathname === step.href;
        const isFirst = index === 0;
        
        // Colors
        const activeColor = "bg-primary text-primary-content";
        const inactiveColor = "bg-neutral text-neutral-content hover:bg-neutral-focus";
        const colorClass = isActive ? activeColor : inactiveColor;
        
        // Arrow shape logic
        let clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)";
        if (isFirst) {
             clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)";
        }

        return (
          <Link
            key={step.href}
            href={step.href}
            className={`flex-1 flex items-center justify-center h-12 font-bold transition-all px-6 text-sm ${colorClass}`}
            style={{ 
                clipPath: clipPath,
                marginLeft: isFirst ? 0 : "-18px",
                zIndex: isActive ? 10 : 0
            }}
          >
            {step.label}
          </Link>
        );
      })}
    </div>
  );
};

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  // Hide header on homepage
  if (isHomepage) {
    return null;
  }

  return (
    <div className="sticky top-0 bg-transparent z-20">
      {/* Main Header Bar */}
      <div className="navbar bg-transparent min-h-0 shrink-0 shadow-md shadow-secondary px-0 sm:px-2">
        <div className="navbar-start w-auto lg:w-auto">
          <details className="dropdown" ref={burgerMenuRef}>
            <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
              <Bars3Icon className="h-1/2" />
            </summary>
            <ul
              className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52"
              onClick={() => {
                burgerMenuRef?.current?.removeAttribute("open");
              }}
            >
              <HeaderMenuLinks />
            </ul>
          </details>
          <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 shrink-0">
            <div className="flex relative w-10 h-10">
              <Image alt="DeBu Studio logo" className="cursor-pointer" fill src="/debu-logo.png" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight">DeBu Studio</span>
              <span className="text-xs">Decentralized Bureaucracy</span>
            </div>
          </Link>
        </div>
        
        {/* Process Navigation - Absolutely Centered */}
        <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
          <ProcessNavBar />
        </div>
        
        <div className="navbar-end ml-auto gap-2">
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
        </div>
      </div>
      
      {/* Mobile Process Navigation */}
      <div className="lg:hidden flex justify-center px-2 py-2 bg-base-100/50">
        <ProcessNavBar />
      </div>
    </div>
  );
};
