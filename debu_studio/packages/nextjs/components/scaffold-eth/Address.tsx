"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { useBytecode } from "wagmi";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { hardhat } from "viem/chains";

type AddressProps = {
  address?: string | undefined;
  disableAddressLink?: boolean;
  format?: "short" | "long";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
};

const blockieSizeMap = {
  xs: 6,
  sm: 7,
  base: 8,
  lg: 9,
  xl: 10,
  "2xl": 12,
  "3xl": 15,
};

/**
 * Displays an address (or ENS) with a Blockie image and option to copy address.
 */
export const Address = ({ address, disableAddressLink, format, size = "base" }: AddressProps) => {
  const [ens, setEns] = useState<string | null>(null);
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);
  const { targetNetwork } = useTargetNetwork();

  const checkAddress = isAddress(address as string);

  // Determine the explorer URL based on the network
  const getExplorerUrl = () => {
    const isLocalNetwork = targetNetwork.id === hardhat.id;
    if (isLocalNetwork) {
      return `http://localhost:3000/blockexplorer/address/${address}`;
    }
    return `https://etherscan.io/address/${address}`;
  };

  // Skeleton UI
  if (!address) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!checkAddress) {
    return <span className="text-error">Wrong address</span>;
  }

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <BlockieAvatar
          address={address}
          ensImage={ensAvatar}
          size={(blockieSizeMap[size] * 10) / 4} // Adjust size calculation as needed
        />
      </div>
      {disableAddressLink ? (
        <span className={`ml-1.5 text-${size} font-normal`}>{address}</span>
      ) : (
        <a
          className={`ml-1.5 text-${size} font-normal`}
          target="_blank"
          href={getExplorerUrl()}
          rel="noopener noreferrer"
        >
          {format === "short" ? address.slice(0, 6) + "..." + address.slice(-4) : address}
        </a>
      )}
      {addressCopied ? (
        <CheckCircleIcon
          className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
          aria-hidden="true"
        />
      ) : (
        <div
          onClick={() => {
            navigator.clipboard.writeText(address);
            setAddressCopied(true);
            setTimeout(() => {
              setAddressCopied(false);
            }, 800);
          }}
          className="cursor-pointer"
        >
          <DocumentDuplicateIcon
            className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};
