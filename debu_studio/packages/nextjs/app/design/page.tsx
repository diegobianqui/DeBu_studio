"use client";

import { useState, useEffect, useRef } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import * as chains from "viem/chains";
import { useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { StepBuilder, ProcessStep } from "~~/components/debu/StepBuilder";
import { notification } from "~~/utils/scaffold-eth";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth/networks";

const Design: NextPage = () => {
  const router = useRouter();
  const [processName, setProcessName] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [processCategory, setProcessCategory] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [deployedProcessAddress, setDeployedProcessAddress] = useState<string | null>(null);
  const [deployedProcessName, setDeployedProcessName] = useState("");
  const [deployedStepsCount, setDeployedStepsCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { data: deployerContractData } = useDeployedContractInfo("DeBuDeployer");
  const { writeContractAsync: deployProcess, isPending } = useScaffoldWriteContract({
    contractName: "DeBuDeployer",
  });

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = processName !== "" || processDescription !== "" || processCategory !== "" || steps.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [processName, processDescription, processCategory, steps]);

  // Handle beforeunload for browser back/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !deployedProcessAddress) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    // Handle link clicks to show warning modal
    const handleLinkClick = (e: MouseEvent) => {
      if (hasUnsavedChanges && !deployedProcessAddress) {
        const target = e.target as HTMLElement;
        const link = target.closest("a[href]") as HTMLAnchorElement;
        
        if (link && link.href && !link.target && !link.href.startsWith("#")) {
          // Check if it's an internal link (not external)
          const isInternal = link.href.includes(window.location.hostname) || link.href.startsWith("/");
          
          if (isInternal) {
            e.preventDefault();
            const href = link.href.replace(window.location.origin, "");
            handleNavigateAway(href);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [hasUnsavedChanges, deployedProcessAddress]);

  const categories = [
    "Public Administration",
    "Private Administration",
    "Supply Chain",
    "Other"
  ];

  const handleAddStep = (newStep: ProcessStep) => {
    setSteps([...steps, newStep]);
    setIsAddStepModalOpen(false);
  };

  const handleDeploy = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!deployerContractData) {
      notification.error("DeBuDeployer contract not found on this network");
      return;
    }

    try {
      const result = await deployProcess({
        functionName: "deployProcess",
        args: [processName, processDescription, processCategory, steps],
      });
      
      setDeployedProcessName(processName);
      setDeployedStepsCount(steps.length);
      if (result) {
        setDeployedProcessAddress(result as string);
      }
      
      notification.success("Process deployed successfully!");
    } catch (e) {
      console.error("Error deploying process:", e);
      notification.error("Failed to deploy process");
    }
  };

  const handleCreateNewProcess = () => {
    setProcessName("");
    setProcessDescription("");
    setProcessCategory("");
    setSteps([]);
    setDeployedProcessAddress(null);
    setDeployedProcessName("");
    setDeployedStepsCount(0);
    setHasUnsavedChanges(false);
  };

  const handleExecuteProcess = () => {
    if (deployedProcessAddress) {
      router.push(`/execute?instance=${deployedProcessAddress}`);
    }
  };

  const handleNavigateAway = (url: string) => {
    setShowWarningModal(true);
    pendingNavigationRef.current = () => {
      router.push(url);
    };
  };

  const confirmNavigation = () => {
    setShowWarningModal(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  };

  const cancelNavigation = () => {
    setShowWarningModal(false);
    pendingNavigationRef.current = null;
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProcessDescription(e.target.value);
    
    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  };

  const handleClearFields = () => {
    setProcessName("");
    setProcessDescription("");
    setProcessCategory("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "32px";
    }
  };

  const handleClearSteps = () => {
    setSteps([]);
  };

  return (
    <div className="flex flex-col flex-grow px-4 lg:px-8 py-4">
      <div className="max-w-7xl w-full mx-auto">
        <h1 className="text-center mb-6">
          <span className="block text-4xl font-bold text-base-content">
            Design Process
          </span>
          <span className="block text-lg mt-2 text-base-content/60">
            Create your Process Blueprint
          </span>
        </h1>

        {deployedProcessAddress ? (
          <div className="max-w-lg mx-auto">
            <div className="card">
              <div className="card-body p-6 text-center">
                {/* Success Icon */}
                <div className="mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                {/* Title and Description */}
                <h2 className="text-xl font-bold text-base-content mb-1">Process Deployed!</h2>
                <p className="text-sm text-base-content/60 mb-4">Your blueprint is ready to use</p>
                
                {/* Process Details - Compact Layout */}
                <div className="space-y-2 mb-4 text-left">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs text-base-content/60 font-medium">Name:</span>
                    <span className="text-sm font-semibold text-base-content text-right flex-1">{deployedProcessName}</span>
                  </div>
                  
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs text-base-content/60 font-medium">Steps:</span>
                    <span className="text-sm font-semibold text-base-content">{deployedStepsCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs text-base-content/60 font-medium">Address:</span>
                    <a 
                      href={getBlockExplorerAddressLink(
                        Object.values(chains).find(chain => chain.id === chainId) || chains.sepolia,
                        deployedProcessAddress
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-primary hover:text-primary-focus hover:underline break-all text-right flex-1"
                    >
                      {deployedProcessAddress.substring(0, 10)}...{deployedProcessAddress.substring(deployedProcessAddress.length - 8)}
                    </a>
                  </div>
                </div>
                
                {/* Action Buttons with "or" separator */}
                <div className="flex flex-col items-center gap-2">
                  <button 
                    className="btn btn-primary btn-sm w-full"
                    onClick={handleExecuteProcess}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Execute Process
                  </button>
                  
                  <span className="text-xs text-base-content/40">or</span>
                  
                  <button 
                    className="btn btn-ghost btn-sm w-full"
                    onClick={handleCreateNewProcess}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
              <div className="lg:col-span-12 border border-primary/40 rounded-lg p-4 shadow-md shadow-primary">
                <h2 className="text-lg font-semibold mb-3">Process Information</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold text-sm">Process Name</span>
                        <span className="label-text-alt text-error">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Expense Reimbursement"
                        className="input input-bordered input-sm w-full focus:input-primary rounded-lg"
                        value={processName}
                        onChange={e => setProcessName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold text-sm">Category</span>
                        <span className="label-text-alt text-error">*</span>
                      </label>
                      <select
                        className="select select-bordered select-sm w-full focus:select-primary rounded-lg"
                        value={processCategory}
                        onChange={e => setProcessCategory(e.target.value)}
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold text-sm">Description</span>
                      </label>
                    </div>
                    <div className="flex gap-2 items-start">
                      <textarea
                        ref={textareaRef}
                        className="textarea textarea-bordered textarea-sm focus:textarea-primary text-sm rounded-lg mt-0 resize-none overflow-hidden flex-1"
                        placeholder="Describe the purpose of this process..."
                        value={processDescription}
                        onChange={handleDescriptionChange}
                        style={{ minHeight: "32px" }}
                        rows={1}
                      ></textarea>
                      <button
                        onClick={handleClearFields}
                        className="btn btn-ghost btn-sm p-2 h-auto mt-0 min-h-0"
                        title="Clear all fields"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-12">
                <div className="card">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="card-title text-lg">Process Steps</h2>
                      <button
                        onClick={handleClearSteps}
                        className="btn btn-ghost btn-sm p-2 h-auto min-h-0"
                        title="Clear all steps"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="w-full overflow-x-auto pb-4 bg-base-100 [data-theme=light]&:bg-base-200 rounded-lg p-3 min-h-[120px] shadow-inner">
                      {steps.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[90px]">
                          <div className="text-center text-base-content/40">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="font-semibold text-sm text-base-content/50">No steps added yet</p>
                            <p className="text-xs text-base-content/40">Click the + arrow below to add your first step</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center min-w-full px-2">
                          {steps.map((step, index) => {
                            const isFirst = index === 0;
                            let clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)";
                            if (isFirst) {
                              clipPath = "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)";
                            }

                            return (
                              <div
                                key={index}
                                className="relative flex-shrink-0 flex items-center justify-center bg-primary text-primary-content w-40 h-20 transition-all hover:shadow-md hover:scale-105 shadow-sm"
                                style={{
                                  clipPath: clipPath,
                                  marginLeft: isFirst ? 0 : "-18px",
                                }}
                              >
                                <div className="flex flex-col items-center text-center px-4">
                                  <div className="badge badge-xs badge-secondary mb-0.5">
                                    Step {index + 1}
                                  </div>
                                  <span className="font-bold text-xs line-clamp-2">{step.name}</span>
                                  <span className="text-[9px] opacity-90 mt-0.5 uppercase tracking-wider">
                                    {step.actionType}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          
                          <button
                            onClick={() => setIsAddStepModalOpen(true)}
                            className="relative flex-shrink-0 flex items-center justify-center bg-base-300 text-base-content/60 hover:text-primary w-40 h-20 transition-all hover:shadow-md hover:scale-105 shadow-sm ml-[-18px] cursor-pointer group"
                            style={{
                              clipPath: "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)",
                            }}
                          >
                            <div className="flex flex-col items-center text-center px-4">
                              <span className="text-3xl font-light group-hover:text-primary transition-colors">+</span>
                            </div>
                          </button>
                        </div>
                      )}
                      
                      {steps.length === 0 && (
                        <div className="flex items-center justify-center px-2">
                          <button
                            onClick={() => setIsAddStepModalOpen(true)}
                            className="relative flex-shrink-0 flex items-center justify-center bg-base-300 text-base-content/60 hover:text-primary w-40 h-20 transition-all hover:shadow-md hover:scale-105 shadow-sm cursor-pointer group"
                            style={{
                              clipPath: "polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)",
                            }}
                          >
                            <div className="flex flex-col items-center text-center px-4">
                              <span className="text-3xl font-light group-hover:text-primary transition-colors">+</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <button 
                className="btn btn-primary btn-md shadow-md hover:shadow-lg hover:scale-105 transition-all px-10"
                onClick={handleDeploy}
                disabled={steps.length === 0 || !processName || !processCategory || !connectedAddress || !deployerContractData || isPending}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deploying...
                  </>
                ) : !connectedAddress ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Connect Wallet
                  </>
                ) : !deployerContractData ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Contract Not Found
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Deploy Process Blueprint
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {isAddStepModalOpen && (
          <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-2xl">
              <h3 className="font-bold text-lg mb-4">Add New Step</h3>
              
              <StepBuilder onAdd={handleAddStep} />
              
              <div className="modal-action">
                <button 
                  className="btn btn-ghost"
                  onClick={() => setIsAddStepModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setIsAddStepModalOpen(false)}>close</button>
            </form>
          </dialog>
        )}

        {showWarningModal && (
          <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-md">
              <div className="flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-center mb-2">Unsaved Changes</h3>
              <p className="text-sm text-base-content/70 text-center mb-6">
                You have unsaved changes in your process blueprint. If you leave this page, your changes will be lost. Are you sure you want to continue?
              </p>
              
              <div className="modal-action flex gap-2 justify-center">
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={cancelNavigation}
                >
                  Stay & Keep Editing
                </button>
                <button 
                  className="btn btn-warning btn-sm"
                  onClick={confirmNavigation}
                >
                  Leave & Discard Changes
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={cancelNavigation}>close</button>
            </form>
          </dialog>
        )}
      </div>
    </div>
  );
};

export default Design;
