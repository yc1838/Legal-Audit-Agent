import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Trash2, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/config";

export function ADHDDumpWindow() {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        setStatus("idle");
        try {
            const response = await fetch(`${API_BASE_URL}/api/adhd-dump`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (response.ok) {
                setStatus("success");
                setContent("");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                throw new Error("Failed to dump thoughts");
            }
        } catch (error) {
            console.error("ADHD Dump Error:", error);
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/90 border-t border-indigo-500/20 font-mono text-[11px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-indigo-500/20">
                <div className="flex items-center space-x-2">
                    <Trash2 className="w-3.5 h-3.5 text-pink-500 drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]" />
                    <span className="uppercase tracking-[0.2em] text-pink-500 font-bold text-[10px]">
                        ADHD Dump 🗑🚮
                    </span>
                </div>
                {status === "success" && (
                    <div className="flex items-center space-x-1 text-green-400 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[9px]">SAVED TO README</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="flex-1 p-3 flex flex-col space-y-2">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your random thoughts, concerns, or todo items here..."
                    className="flex-1 bg-gray-950/50 border border-indigo-500/10 rounded p-2 text-indigo-300 placeholder:text-indigo-900/40 focus:outline-none focus:border-indigo-500/30 transition-colors resize-none custom-scrollbar"
                />

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !content.trim()}
                    className={cn(
                        "flex items-center justify-center space-x-2 py-2 rounded font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none",
                        status === "error" ? "bg-red-900/50 text-red-400 border border-red-500/30" :
                            "bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30"
                    )}
                >
                    {isSubmitting ? (
                        <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Submit to Brain Dump</span>
                </button>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(99, 102, 241, 0.2);
                  border-radius: 2px;
                }
            `}</style>
        </div>
    );
}
