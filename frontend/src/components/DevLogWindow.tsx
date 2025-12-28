import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { RefreshCcw, Check, AlertCircle } from "lucide-react";

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

interface DevLogWindowProps {
    logs: LogEntry[];
}

export function DevLogWindow({ logs }: DevLogWindowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
    const [syncMessage, setSyncMessage] = useState("");

    const handleGitSync = async () => {
        setIsSyncing(true);
        setSyncStatus("idle");
        try {
            const response = await fetch("http://localhost:8000/api/git/sync", {
                method: "POST",
            });
            const data = await response.json();
            if (response.ok) {
                setSyncStatus("success");
                setSyncMessage(data.message);
            } else {
                throw new Error(data.detail || "Sync failed");
            }
        } catch (error) {
            console.error("Git sync error:", error);
            setSyncStatus("error");
            setSyncMessage(error instanceof Error ? error.message : "Connection failed");
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncStatus("idle"), 5000);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogColor = (level: string) => {
        switch (level.toUpperCase()) {
            case "INFO":
                return "text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]";
            case "DEBUG":
                return "text-purple-400 opacity-80";
            case "WARNING":
                return "text-yellow-400 drop-shadow-[0_0_2px_rgba(250,204,21,0.8)]";
            case "ERROR":
            case "CRITICAL":
                return "text-red-500 drop-shadow-[0_0_3px_rgba(239,68,68,0.9)] font-bold";
            default:
                return "text-gray-300";
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/80 border-l border-indigo-500/30 font-mono text-[11px] overflow-hidden shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-indigo-500/20">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]" />
                    <span className="uppercase tracking-[0.2em] text-cyan-500 font-bold text-[10px]">
                        Dev_Terminal_v2.0
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleGitSync}
                        disabled={isSyncing}
                        className={cn(
                            "flex items-center space-x-1.5 px-2 py-1 rounded border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                            syncStatus === "success" ? "border-green-500/50 bg-green-500/10 text-green-400" :
                                syncStatus === "error" ? "border-red-500/50 bg-red-500/10 text-red-400" :
                                    "border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-300"
                        )}
                        title="Sync changes to GitHub"
                    >
                        {isSyncing ? (
                            <RefreshCcw className="w-3 h-3 animate-spin" />
                        ) : syncStatus === "success" ? (
                            <Check className="w-3 h-3" />
                        ) : syncStatus === "error" ? (
                            <AlertCircle className="w-3 h-3" />
                        ) : (
                            <RefreshCcw className="w-3 h-3" />
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                            {isSyncing ? "Syncing..." : syncStatus === "success" ? "Synced" : syncStatus === "error" ? "Failed" : "Sync"}
                        </span>
                    </button>
                    <div className="text-[9px] text-gray-600">SYS_STATUS: ONLINE</div>
                </div>
            </div>

            {/* Log Content */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar scroll-smooth"
            >
                {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-700 italic">
                        Waiting for uplink...
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="flex space-x-2 group hover:bg-white/5 transition-colors leading-relaxed">
                            <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                            <span className={cn("block break-all", getLogColor(log.level))}>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Input simulation */}
            <div className="px-4 py-1.5 bg-indigo-500/5 border-t border-indigo-500/20 text-[9px] flex justify-between items-center text-indigo-400/50">
                <div className="flex items-center space-x-2">
                    <span>ANTIGRAVITY_KERNEL_v4.2</span>
                    {syncMessage && (
                        <span className={cn(
                            "ml-2 px-1 rounded animate-in fade-in slide-in-from-left-2",
                            syncStatus === "success" ? "text-green-500/70" : "text-red-500/70"
                        )}>
                            {">"} {syncMessage}
                        </span>
                    )}
                </div>
                <span className="animate-pulse">_</span>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
        </div>
    );
}
