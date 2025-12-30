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
}

interface ErrorListPanelProps {
    errors: AuditError[];
}

export function ErrorListPanel({ errors }: ErrorListPanelProps) {
    if (!errors || errors.length === 0) return null;

    return (
        <div className="h-full flex flex-col bg-gray-950 border-gray-800 border-l overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Detected Risks
                    <span className="text-xs font-mono text-gray-500 ml-auto bg-gray-800 px-2 py-1 rounded-full">
                        {errors.length} ISSUES
                    </span>
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {errors.map((item, index) => (
                    <Card key={index} className="bg-gray-900 border-gray-800 shadow-lg animate-in slide-in-from-right-10 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
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
                ))}

                <div className="h-20" /> {/* Spacer for scrolling */}
            </div>
        </div>
    );
}
