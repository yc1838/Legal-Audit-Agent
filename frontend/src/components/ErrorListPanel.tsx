import { AlertTriangle, MapPin, Lightbulb } from "lucide-react";
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
        <div className="h-full flex flex-col bg-gray-950 border-gray-800 border-l overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Detected Risks
                    {errors.length > 0 && (
                        <span className="text-xs font-mono text-gray-500 ml-auto bg-gray-800 px-2 py-1 rounded-full">
                            {errors.length} ISSUES
                        </span>
                    )}
                </h2>
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
                            className={`cursor-pointer transition-all duration-300 border-gray-800 shadow-lg animate-in slide-in-from-right-10 
                            ${selectedIndex === index ? 'bg-gray-800 border-indigo-500 scale-[1.02] shadow-indigo-500/20 ring-1 ring-indigo-500' : 'bg-gray-900 hover:bg-gray-800 hover:scale-[1.02]'}
                        `}
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => onSelectError && onSelectError(index)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-mono text-gray-500 uppercase flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {item.location}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 text-sm text-gray-200">
                                <div className="border-l-2 border-red-500 pl-3 py-1 bg-red-950/20 rounded-r">
                                    {item.error}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-800/50 pt-3 pb-3">
                                <div className="text-xs text-green-400 flex gap-2 items-start w-full">
                                    <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span className="italic">{item.suggestion}</span>
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


