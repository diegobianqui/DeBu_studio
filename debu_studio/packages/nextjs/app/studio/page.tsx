"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { StepBuilder, ProcessStep } from "~~/components/debu/StepBuilder";

const Studio: NextPage = () => {
  const [processName, setProcessName] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([]);

  const { writeContractAsync: deployProcess } = useScaffoldWriteContract("DeBuDeployer");

  const handleAddStep = (newStep: ProcessStep) => {
    setSteps([...steps, newStep]);
  };

  const handleDeploy = async () => {
    try {
      await deployProcess({
        functionName: "deployProcess",
        args: [processName, processDescription, steps],
      });
      // Reset form after successful deployment
      setProcessName("");
      setProcessDescription("");
      setSteps([]);
    } catch (e) {
      console.error("Error deploying process:", e);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">DeBu Studio</span>
          <span className="block text-2xl mb-2">Design your Decentralized Process</span>
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

            <div className="divider">Steps</div>

            <div className="space-y-4 mb-4">
              {steps.map((step, index) => (
                <div key={index} className="alert alert-info">
                  <div>
                    <h3 className="font-bold">{index + 1}. {step.name}</h3>
                    <div className="text-xs">{step.description}</div>
                    <div className="badge badge-sm">{step.actionType}</div>
                  </div>
                </div>
              ))}
              {steps.length === 0 && (
                <div className="text-center text-gray-500 italic">No steps added yet.</div>
              )}
            </div>

            <StepBuilder onAdd={handleAddStep} />

            <div className="card-actions justify-end mt-6">
              <button 
                className="btn btn-primary"
                onClick={handleDeploy}
                disabled={steps.length === 0 || !processName}
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

export default Studio;
