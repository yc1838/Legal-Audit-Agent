import { CheckCircle2, Circle, Loader2, FileText, Share2, Search, FileCheck, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageId = "idle" | "extracting" | "distributing" | "analyzing" | "locating" | "finalizing" | "completed";

interface Stage {
    id: StageId;
    label: string;
    description: string;
    icon: React.ReactNode;
}

const STAGES: Stage[] = [
    {
        id: "extracting",
        label: "Document Processor",
        description: "Reading and extracting text from PDF...",
        icon: <FileText className="w-5 h-5" />,
    },
    {
        id: "distributing",
        label: "Topic Distributor",
        description: "Routing document to specialized agents...",
        icon: <Share2 className="w-5 h-5" />,
    },
    {
        id: "analyzing",
        label: "Legal Reviewer",
        description: "AI is auditing clauses and identifying risks...",
        icon: <Search className="w-5 h-5" />,
    },
    {
        id: "locating",
        label: "Locator Swarm",
        description: "Scanning PDF for precise highlight coordinates...",
        icon: <ScanSearch className="w-5 h-5" />,
    },
    {
        id: "finalizing",
        label: "Report Generator",
        description: "Synthesizing final audit results...",
        icon: <FileCheck className="w-5 h-5" />,
    },
];

interface ProcessingStepperProps {
    currentStage: StageId;
    statusMessage?: string;
}

export function ProcessingStepper({ currentStage, statusMessage }: ProcessingStepperProps) {
    const getStageStatus = (stageId: StageId) => {
        const stageIndex = STAGES.findIndex((s) => s.id === stageId);
        const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

        if (currentStage === "completed") return "completed";
        if (stageIndex < currentIndex) return "completed";
        if (stageIndex === currentIndex) return "in-progress";
        return "waiting";
    };

    return (
        <div className="space-y-6 py-4">
            {STAGES.map((stage, index) => {
                const status = getStageStatus(stage.id);
                const isActive = status === "in-progress";
                const isCompleted = status === "completed";

                return (
                    <div key={stage.id} className="relative flex items-start group">
                        {/* Connector Line */}
                        {index !== STAGES.length - 1 && (
                            <div
                                className={cn(
                                    "absolute left-4 top-10 w-px h-10 -ml-px transition-all duration-1000",
                                    isCompleted ? "bg-gradient-to-b from-white/30 to-white/10" : "bg-white/5"
                                )}
                            />
                        )}

                        {/* Icon Circle */}
                        <div
                            className={cn(
                                "relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-700 z-10",
                                isCompleted
                                    ? "bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md"
                                    : isActive
                                        ? "bg-white/5 border-blue-400/30 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-110"
                                        : "bg-white/0 border-white/10 text-gray-600"
                            )}
                        >
                            {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            ) : isActive ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                            ) : (
                                <Circle className="w-4 h-4 fill-current opacity-10" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="ml-4 flex-1">
                            <div className="flex items-center space-x-2">
                                <span
                                    className={cn(
                                        "text-sm font-medium tracking-wide transition-colors duration-500",
                                        isActive ? "text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.3)]" : isCompleted ? "text-white/80" : "text-gray-500/50"
                                    )}
                                >
                                    {stage.label}
                                </span>
                                {isActive && (
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse shadow-[0_0_8px_#93c5fd]" />
                                )}
                            </div>
                            <p
                                className={cn(
                                    "text-xs transition-colors duration-500 font-light",
                                    isActive ? "text-blue-200/70" : "text-gray-500/40"
                                )}
                            >
                                {isActive ? statusMessage || stage.description : stage.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
