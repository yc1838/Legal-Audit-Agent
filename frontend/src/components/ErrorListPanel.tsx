import { MapPin, Lightbulb } from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export interface AuditError {
    location: string;
    error: string;
    suggestion: string;
    exact_quote?: string;
    boundingBoxes?: any[];
}

interface ErrorListPanelProps {
    errors: AuditError[];
    onSelectError?: (index: number) => void;
    selectedIndex?: number | null;
    isProcessing: boolean;
}


export function ErrorListPanel({ errors, onSelectError, selectedIndex, isProcessing }: ErrorListPanelProps) {
    // If processing, show loading state
    // If not processing and no errors, show empty state
    // If errors, show list

    return (
        <div className="h-full flex flex-col glass-card border-l-0 rounded-l-none rounded-r-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-lg font-light tracking-wide text-white/90 flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500/50 shadow-[0_0_10px_#ef4444]"></span>
                    </span>
                    Risk Analysis
                </h2>
                {errors.length > 0 && (
                    <span className="text-[10px] font-medium tracking-widest text-white/50 bg-white/5 px-3 h-6 rounded-full border border-white/5 flex items-center justify-center min-w-[60px]">
                        {errors.length} ISSUES
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isProcessing && errors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center space-y-4 animate-in fade-in duration-500">
                        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        <div>
                            <p className="text-sm font-medium text-gray-300">Analyzing Document...</p>
                            <p className="text-xs text-gray-600 mt-1">Cross-referencing clauses with legal standards</p>
                        </div>
                    </div>
                ) : !isProcessing && errors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center space-y-2 animate-in fade-in duration-500">
                        <div className="h-12 w-12 rounded-full bg-green-900/20 flex items-center justify-center mb-2">
                            <Lightbulb className="h-6 w-6 text-green-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">No Risks Detected</p>
                        <p className="text-xs text-gray-600">The document appears to be clean.</p>
                    </div>
                ) : (
                    errors.map((item, index) => (
                        <Card
                            key={index}
                            className={`cursor-pointer transition-all duration-500 border-0 shadow-lg animate-in slide-in-from-right-10 rounded-xl overflow-hidden group
                            ${selectedIndex === index
                                    ? 'bg-white/10 ring-1 ring-white/20 scale-[1.02]'
                                    : 'glass-input hover:bg-white/5 hover:scale-[1.01]'}
                        `}
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => onSelectError && onSelectError(index)}
                        >
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-white/30" />
                                    {item.location}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-4 text-sm font-light text-gray-200 leading-relaxed relative">
                                <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-red-500/50 to-transparent rounded-r-full opactiy-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="pl-2">
                                    {item.error}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-black/20 pt-3 pb-3 px-4 border-t border-white/5">
                                <div className="text-xs text-white/60 flex gap-2 items-start w-full">
                                    <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-yellow-400/50" />
                                    <span className="font-light">{item.suggestion}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    ))
                )}

                <div className="h-20" /> {/* Spacer for scrolling */}
            </div>
        </div>
    );
}

