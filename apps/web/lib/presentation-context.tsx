"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface TrayDoc {
  documentId: string;
  docName: string;
  companyLabel: string;
  docType: string;
  mimeType: string;
  position: number;
}

interface PresentationContextValue {
  selectedDocs: TrayDoc[];
  addDoc: (doc: Omit<TrayDoc, "position">) => void;
  removeDoc: (documentId: string) => void;
  clearDocs: () => void;
  isSelected: (documentId: string) => boolean;
}

const PresentationContext = createContext<PresentationContextValue | null>(null);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [selectedDocs, setSelectedDocs] = useState<TrayDoc[]>([]);

  const addDoc = useCallback((doc: Omit<TrayDoc, "position">) => {
    setSelectedDocs((prev) => {
      if (prev.find((d) => d.documentId === doc.documentId)) return prev;
      if (prev.length >= 10) return prev;
      return [...prev, { ...doc, position: prev.length }];
    });
  }, []);

  const removeDoc = useCallback((documentId: string) => {
    setSelectedDocs((prev) =>
      prev.filter((d) => d.documentId !== documentId).map((d, i) => ({ ...d, position: i }))
    );
  }, []);

  const clearDocs = useCallback(() => setSelectedDocs([]), []);

  const isSelected = useCallback(
    (documentId: string) => selectedDocs.some((d) => d.documentId === documentId),
    [selectedDocs]
  );

  return (
    <PresentationContext.Provider value={{ selectedDocs, addDoc, removeDoc, clearDocs, isSelected }}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentationTray() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error("usePresentationTray must be inside PresentationProvider");
  return ctx;
}
