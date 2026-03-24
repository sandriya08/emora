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
    diagnosisLabels: string[];
    diagnosisDate: string | null;
    diagnosisFocus: string | null;
    setDiagnosisResult: (data: DiagnosisResult, labels: string[], date?: string, focus?: string) => void;
    fetchLatest: (userId: string, apiUrl: string) => Promise<void>;
};

const DiagnosisContext = createContext<DiagnosisContextType | null>(null);

export const DiagnosisProvider = ({ children }: { children: ReactNode }) => {
    const [diagnosisResult, setDiagnosisResultState] =
        useState<DiagnosisResult | null>(null);
    const [diagnosisLabels, setDiagnosisLabels] = useState<string[]>([]);
    const [diagnosisDate, setDiagnosisDate] = useState<string | null>(null);
    const [diagnosisFocus, setDiagnosisFocus] = useState<string | null>(null);
 
    const setDiagnosisResult = (data: DiagnosisResult, labels: string[], date?: string, focus?: string) => {
        setDiagnosisResultState(data);
        setDiagnosisLabels(labels);
        if (date) setDiagnosisDate(date);
        if (focus) setDiagnosisFocus(focus);
    };

    const fetchLatest = async (userId: string, apiUrl: string) => {
        try {
            const res = await fetch(`${apiUrl}/api/selfcare/diagnosis?userId=${userId}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const latest = data[0];
                if (latest && latest.results) {
                    setDiagnosisResultState(latest.results);
                    setDiagnosisLabels(latest.labels || []);
                    setDiagnosisDate(latest.timestamp);
                    setDiagnosisFocus(latest.focus || "Individual");
                }
            }
        } catch (err) {
            console.error("Error fetching latest diagnosis in context:", err);
        }
    };
 
    return (
        <DiagnosisContext.Provider value={{ diagnosisResult, diagnosisLabels, diagnosisDate, diagnosisFocus, setDiagnosisResult, fetchLatest }}>
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
