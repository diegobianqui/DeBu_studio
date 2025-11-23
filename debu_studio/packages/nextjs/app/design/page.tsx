"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { StepBuilder, ProcessStep } from "~~/components/debu/StepBuilder";

const Design: NextPage = () => {
  const [processName, setProcessName] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [processCategory, setProcessCategory] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([]);

  const { writeContractAsync: deployProcess } = useScaffoldWriteContract("DeBuDeployer");

  const categories = [
    "Finance",
    "Human Resources",
    "Legal",
    "Operations",
    "IT & Technology",
    "Procurement",
    "Customer Service",
    "Compliance",
    "Marketing",
    "Other"
  ];

  const handleAddStep = (newStep: ProcessStep) => {
    setSteps([...steps, newStep]);
  };

  const handleDeploy = async () => {
    try {
      await deployProcess({
        functionName: "deployProcess",
        args: [processName, processDescription, processCategory, steps],
      });
      // Reset form after successful deployment
      setProcessName("");
      setProcessDescription("");
      setProcessCategory("");
      setSteps([]);
    } catch (e) {
      console.error("Error deploying process:", e);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Design Process</span>
          <span className="block text-2xl mb-2">Create your Decentralized Process</span>
        </h1>

        <div className="card w-96 bg-base-100 shadow-xl md:w-[600px]">
          <div className="card-body">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Process Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Expense Reimbursement"
                className="input input-bordered w-full"
                value={processName}
                onChange={e => setProcessName(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Describe the purpose of this process..."
                value={processDescription}
                onChange={e => setProcessDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={processCategory}
                onChange={e => setProcessCategory(e.target.value)}
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="divider">Steps</div>

            <div className="w-full overflow-x-auto pb-4 mb-4">
              {steps.length === 0 ? (
                <div className="text-center text-gray-500 italic py-8 border-2 border-dashed border-base-300 rounded-lg">
                  No steps added yet. Add steps below to visualize your process.
                </div>
              ) : (
                <div className="flex items-center min-w-full px-2">
                  {steps.map((step, index) => {
                    const isFirst = index === 0;
                    
                    // Arrow shape logic
                    // First: Flat start, Arrow end
                    // Others: Arrow start (cutout), Arrow end
                    let clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)";
                    if (isFirst) {
                         clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)";
                    }

                    return (
                      <div
                        key={index}
                        className="relative flex-shrink-0 flex items-center justify-center bg-secondary text-secondary-content w-48 h-24 transition-all hover:brightness-95"
                        style={{
                          clipPath: clipPath,
                          marginLeft: isFirst ? 0 : "-18px", // 2px gap
                        }}
                      >
                        <div className="flex flex-col items-center text-center px-6">
                            <span className="font-bold text-sm line-clamp-2">{step.name}</span>
                            <span className="text-[10px] opacity-80 mt-1 uppercase tracking-wider bg-secondary-focus px-2 py-0.5 rounded-full">
                              {step.actionType}
                            </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <StepBuilder onAdd={handleAddStep} />

            <div className="card-actions justify-end mt-6">
              <button 
                className="btn btn-primary"
                onClick={handleDeploy}
                disabled={steps.length === 0 || !processName || !processCategory}
              >
                Deploy Process Blueprint
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Design;
