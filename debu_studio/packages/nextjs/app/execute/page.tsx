"use client";

import type { NextPage } from "next";
import { useSearchParams } from "next/navigation";
import { InstanceCard } from "~~/components/debu/InstanceCard";

const Execute: NextPage = () => {
  const searchParams = useSearchParams();
  const instanceParam = searchParams.get("instance");

  if (!instanceParam) {
    return (
      <div className="flex flex-col flex-grow px-4 lg:px-8 py-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl w-full mx-auto">
          <div className="card bg-white dark:bg-slate-800 shadow-xl shadow-blue-100/50 dark:shadow-blue-900/50 border border-blue-100/50 dark:border-blue-800/50">
            <div className="card-body p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">No process instance selected</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Go to Browse section to start a new process instance</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow px-4 lg:px-8 py-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl w-full mx-auto">
        <h1 className="text-center mb-6">
          <span className="block text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
            Execute Process
          </span>
          <span className="block text-lg mt-1 text-slate-600 dark:text-slate-400">
            Run your process instance
          </span>
        </h1>

        <div className="card bg-white dark:bg-slate-800 shadow-xl shadow-blue-100/50 dark:shadow-blue-900/50 border border-blue-100/50 dark:border-blue-800/50">
          <div className="card-body p-6">
            <InstanceCard address={instanceParam} isFullView={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Execute;
