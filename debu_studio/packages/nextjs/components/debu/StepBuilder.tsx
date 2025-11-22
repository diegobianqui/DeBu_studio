"use client";

import { useState } from "react";

export type ProcessStep = {
  name: string;
  description: string;
  actionType: string;
  config: string;
};

type StepBuilderProps = {
  onAdd: (step: ProcessStep) => void;
};

export const StepBuilder = ({ onAdd }: StepBuilderProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState("form");

  const handleAdd = () => {
    if (!name) return;
    
    onAdd({
      name,
      description,
      actionType,
      config: "{}", // Default empty config for now
    });

    // Reset fields
    setName("");
    setDescription("");
    setActionType("form");
  };

  return (
    <div className="bg-base-200 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Add New Step</h3>
      
      <div className="form-control w-full mb-2">
        <input
          type="text"
          placeholder="Step Name"
          className="input input-bordered input-sm w-full"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="form-control w-full mb-2">
        <input
          type="text"
          placeholder="Step Description"
          className="input input-bordered input-sm w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="form-control w-full mb-4">
        <select 
          className="select select-bordered select-sm w-full"
          value={actionType}
          onChange={e => setActionType(e.target.value)}
        >
          <option value="form">Form Input</option>
          <option value="approval">Approval</option>
          <option value="payment">Payment</option>
        </select>
      </div>

      <button className="btn btn-secondary btn-sm w-full" onClick={handleAdd}>
        Add Step
      </button>
    </div>
  );
};
