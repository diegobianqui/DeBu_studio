"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { label: "Studio", href: "/studio" },
  { label: "Browse", href: "/browse" },
  { label: "Execute", href: "/execute" },
];

export const ArrowNavigation = () => {
  const pathname = usePathname();

  return (
    <div className="flex w-full max-w-3xl mx-auto">
      {steps.map((step, index) => {
        const isActive = pathname === step.href;
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        
        // DaisyUI steps component or custom CSS arrows?
        // Let's use a custom CSS arrow implementation using clip-path or borders for a cleaner look
        // Or simpler: DaisyUI 'steps' component is vertical usually, but can be horizontal.
        // However, the user specifically asked for "arrow pointing to the right with 3 segments".
        // Let's try a custom implementation that looks like a breadcrumb/arrow bar.
        
        return (
          <Link 
            key={step.href} 
            href={step.href}
            className={`
              relative flex-1 flex items-center justify-center h-12 
              font-bold text-sm sm:text-base transition-colors duration-200
              ${isActive ? "bg-primary text-primary-content" : "bg-base-200 hover:bg-base-300 text-base-content"}
              ${isFirst ? "rounded-l-lg" : ""}
              ${isLast ? "rounded-r-lg" : ""}
            `}
            style={{
              clipPath: isLast 
                ? isFirst 
                    ? "none" 
                    : "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)"
                : isFirst
                    ? "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)"
                    : "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)",
               // Actually, standard CSS arrows are easier with ::after/::before but clip-path is cleaner if we get the coordinates right.
               // Let's try a simpler approach: standard rectangular blocks with arrow tips.
               // 
               // Shape for middle/start:
               //  Start: [ | >
               //  Mid:   < | >
               //  End:   < | ]
            }}
          >
            {/* We need a better way to do arrows that overlap nicely. 
                Let's use a standard DaisyUI 'steps' but styled, OR a simple flex row with chevron separators?
                User asked for "segments representing... arrow pointing to the right".
                
                Let's try the "breadcrumbs" style but full width blocks.
            */}
             <div className={`
                flex items-center justify-center w-full h-full
                ${!isFirst && "pl-6"} 
                ${!isLast && "pr-2"}
             `}>
                {step.label}
             </div>
             
             {/* Arrow Tip Overlay for visual separation if using same colors? 
                 Actually, let's use a simpler CSS trick for the arrow shape.
             */}
          </Link>
        );
      })}
    </div>
  );
};

// Let's try a different approach for the ArrowNavigation that is more robust
// using standard CSS borders for the arrow effect.

export const ArrowNavigationV2 = () => {
    const pathname = usePathname();
  
    return (
      <div className="flex w-full justify-center items-center overflow-hidden rounded-lg">
        {steps.map((step, index) => {
          const isActive = pathname === step.href;
          
          return (
            <Link
              key={step.href}
              href={step.href}
              className={`
                relative flex-1 h-12 flex items-center justify-center text-center
                ${isActive ? "bg-primary text-primary-content z-10" : "bg-base-200 text-base-content hover:bg-base-300"}
              `}
            >
                {/* The Arrow Shape Logic */}
                {/* Left cutout (for all except first) */}
                {index !== 0 && (
                    <div className={`absolute left-0 top-0 bottom-0 w-4 overflow-hidden z-20`}>
                        <div className={`
                            absolute -left-4 top-0 bottom-0 w-4 bg-base-100
                            transform origin-left scale-x-100
                        `} 
                        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}
                        />
                        {/* We need the color of the PREVIOUS element to fill the gap? No, we want a cutout. */}
                    </div>
                )}

                {/* Right arrow tip (for all except last) */}
                {index !== steps.length - 1 && (
                    <div className={`absolute -right-4 top-0 bottom-0 w-4 z-20`}>
                         {/* This is getting complicated with CSS in JS. Let's use a simpler DaisyUI Steps component but customized. */}
                    </div>
                )}
                
                <span className="font-bold">{step.label}</span>
            </Link>
          );
        })}
      </div>
    );
  };

// Let's go with a clean DaisyUI Steps implementation first, as it's built-in and looks like arrows.
export const ArrowSteps = () => {
    const pathname = usePathname();
    
    return (
        <ul className="steps w-full max-w-2xl steps-horizontal">
            {steps.map((step) => {
                const isActive = pathname === step.href;
                // DaisyUI steps logic: 'step-primary' colors the dot/line.
                // But we want the whole segment to look like a process.
                // Maybe just a custom flex container is best.
                return (
                    <li key={step.href} className={`step ${isActive ? "step-primary" : ""}`}>
                        <Link href={step.href}>{step.label}</Link>
                    </li>
                )
            })}
        </ul>
    )
}

// Final attempt at the requested "Arrow Bar" design
export const ProcessNavBar = () => {
    const pathname = usePathname();

    return (
        <div className="flex w-full max-w-2xl mx-auto drop-shadow-md">
            {steps.map((step, index) => {
                const isActive = pathname === step.href;
                const isFirst = index === 0;
                const isLast = index === steps.length - 1;
                
                // Colors
                const activeColor = "bg-primary text-primary-content";
                const inactiveColor = "bg-neutral text-neutral-content hover:bg-neutral-focus";
                const colorClass = isActive ? activeColor : inactiveColor;
                
                // We use clip-path for the arrow shape
                // Arrow pointing right: polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)
                // But for the next item to fit in, it needs a matching cutout: polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)
                
                let clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)"; // Default arrow (First)
                
                if (isFirst) {
                    clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)";
                } else {
                    // Middle and Last (both point right with cutout on left)
                    // Cutout on left means vertices: 0% 0% -> ... -> 0% 100% -> 20px 50%
                    clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)";
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
