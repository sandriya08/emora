import { createContext, ReactNode, useContext, useState } from "react";

export type Severity = "Low" | "Moderate" | "High";

export type DiagnosisDetail = {
    score: number;
    severity: Severity;
    causes: string[];
};

export type DiagnosisResult = {
    [key: string]: DiagnosisDetail;
};

type DiagnosisContextType = {
    diagnosisResult: DiagnosisResult | null;
    setDiagnosisResult: (data: DiagnosisResult) => void;
};

const DiagnosisContext = createContext<DiagnosisContextType | null>(null);

export const DiagnosisProvider = ({ children }: { children: ReactNode }) => {
    const [diagnosisResult, setDiagnosisResult] =
        useState<DiagnosisResult | null>(null);

    return (
        <DiagnosisContext.Provider value={{ diagnosisResult, setDiagnosisResult }}>
            {children}
        </DiagnosisContext.Provider>
    );
};

export const useDiagnosis = () => {
    const context = useContext(DiagnosisContext);
    if (!context) {
        throw new Error("useDiagnosis must be used within DiagnosisProvider");
    }
    return context;
};
