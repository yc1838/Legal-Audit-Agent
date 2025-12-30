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
                                    "absolute left-4 top-10 w-0.5 h-10 -ml-px transition-colors duration-500",
                                    isCompleted ? "bg-indigo-500" : "bg-gray-700"
                                )}
                            />
                        )}

                        {/* Icon Circle */}
                        <div
                            className={cn(
                                "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-500 scale-100",
                                isCompleted
                                    ? "bg-indigo-500 border-indigo-500 text-white"
                                    : isActive
                                        ? "border-indigo-400 text-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)] scale-110"
                                        : "border-gray-600 text-gray-600"
                            )}
                        >
                            {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : isActive ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Circle className="w-4 h-4 fill-current opacity-20" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="ml-4 flex-1">
                            <div className="flex items-center space-x-2">
                                <span
                                    className={cn(
                                        "text-sm font-semibold transition-colors duration-500",
                                        isActive ? "text-indigo-400" : isCompleted ? "text-white" : "text-gray-500"
                                    )}
                                >
                                    {stage.label}
                                </span>
                                {isActive && (
                                    <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                                )}
                            </div>
                            <p
                                className={cn(
                                    "text-xs transition-colors duration-500",
                                    isActive ? "text-gray-300" : "text-gray-500"
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
