import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
                <div className="text-[9px] text-gray-600">SYS_STATUS: ONLINE</div>
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
            <div className="px-4 py-1 bg-indigo-500/5 text-[9px] text-indigo-400/50 flex justify-between">
                <span>ANTIGRAVITY_KERNEL_v4.2</span>
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
