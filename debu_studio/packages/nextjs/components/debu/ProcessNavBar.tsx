"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { label: "Design", href: "/design" },
  { label: "Browse", href: "/browse" },
  { label: "Execute", href: "/execute" },
];

export const ProcessNavBar = () => {
  const pathname = usePathname();

  return (
    <div className="flex w-full max-w-2xl mx-auto">
      {steps.map((step, index) => {
        const isActive = pathname === step.href;
        const isFirst = index === 0;
        
        // Colors
        const activeColor = "bg-primary text-primary-content";
        const inactiveColor = "bg-neutral text-neutral-content hover:bg-neutral-focus";
        const colorClass = isActive ? activeColor : inactiveColor;
        
        // Arrow shape logic
        // First: Flat start, Arrow end
        // Others: Arrow start (cutout), Arrow end
        let clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)";
        if (isFirst) {
             clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)";
        }

        return (
          <Link
            key={step.href}
            href={step.href}
            className={`flex-1 flex items-center justify-center h-12 font-bold transition-all ${colorClass}`}
            style={{ 
                clipPath: clipPath,
                marginLeft: isFirst ? 0 : "-18px", // Overlap to fit the arrow into the cutout, leaving 2px gap
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
