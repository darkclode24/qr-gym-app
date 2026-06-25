"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  autoStart?: boolean;
}

export default function QRScanner({ onScanSuccess, onScanError, autoStart = true }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-container";

  const startScanner = async () => {
    setErrorMsg("");
    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode(containerId);
      }

      if (qrScannerRef.current.isScanning) {
        return;
      }

      await qrScannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          if (onScanError) {
            onScanError(errorMessage);
          }
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera initialisation error:", err);
      setHasCamera(false);
      setErrorMsg("Kamera tidak ditemukan atau izin akses kamera ditolak.");
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  useEffect(() => {
    // Start scanner automatically on mount if autoStart is true
    if (autoStart) {
      startScanner();
    }

    return () => {
      // Stop scanner on unmount
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch((err) => console.error("Clean-up error:", err));
      }
    };
  }, [autoStart]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 bg-[#1a1a1a] rounded-3xl border border-[#2d2d2d] shadow-xl">
      <div className="relative w-full aspect-square bg-[#0c0d0e] rounded-2xl overflow-hidden border border-[#3d3d3d] flex items-center justify-center">
        {/* Container for scanner */}
        <div id={containerId} className="w-full h-full object-cover"></div>

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0c0d0e]/90">
            {errorMsg ? (
              <p className="text-red-500 text-sm font-medium mb-4">{errorMsg}</p>
            ) : (
              <p className="text-gray-400 text-sm mb-4">Pemindai kamera dinonaktifkan.</p>
            )}
            <button
              onClick={startScanner}
              className="px-6 py-2.5 bg-[#f5b731] hover:bg-[#c9941f] text-black font-extrabold text-sm rounded-xl transition duration-200"
            >
              Aktifkan Kamera
            </button>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#f5b731]/40 rounded-2xl flex items-center justify-center">
            {/* Target overlay indicator */}
            <div className="w-60 h-60 border-2 border-[#f5b731] rounded-2xl relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#f5b731]"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#f5b731]"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#f5b731]"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#f5b731]"></div>
            </div>
          </div>
        )}
      </div>

      {isScanning && (
        <button
          onClick={stopScanner}
          className="mt-4 px-5 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 font-semibold text-xs rounded-xl transition duration-200"
        >
          Matikan Kamera
        </button>
      )}
    </div>
  );
}
