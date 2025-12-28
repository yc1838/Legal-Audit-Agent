import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProcessingStepper, StageId } from "@/components/ProcessingStepper";
import { DevLogWindow, LogEntry } from "@/components/DevLogWindow";
import { ADHDDumpWindow } from "@/components/ADHDDumpWindow";
import { Loader2, Bug } from "lucide-react";

function App() {
  const [auditResult, setAuditResult] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [testMode, setTestMode] = useState(true);

  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageId>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Developer logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showDevLogs, setShowDevLogs] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const clearState = () => {
    setAuditResult("");
    setLogs([]);
    setIsProcessing(true);
    setCurrentStage("extracting");
  };

  const handleAudit = async () => {
    if (!file) {
      alert("Please upload a contract file.");
      return;
    }

    clearState();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`http://localhost:8000/analyze-contract-stream/?test_mode=${testMode}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to start analysis");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.stage) {
              setCurrentStage(data.stage);
              setStatusMessage(data.message || "");
            } else if (data.log) {
              setLogs(prev => [...prev, data.log]);
            } else if (data.result) {
              setAuditResult(JSON.stringify(data.result, null, 2));
              setCurrentStage("completed");
            }
          } catch (e) {
            console.error("Error parsing stream line:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error auditing contract:", error);
      setAuditResult("Error: Could not connect to the server.");
      setCurrentStage("idle");
      setLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        level: "ERROR",
        message: "Connection failed. Backend might be offline."
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex overflow-hidden">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto custom-scrollbar">
        <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 shadow-2xl overflow-hidden my-8">
          <div className="h-1.5 w-full bg-gray-800">
            {isProcessing && (
              <div className="h-full bg-indigo-500 animate-[loading_2s_infinite]" style={{ width: '40%' }}></div>
            )}
          </div>
          <CardHeader className="pt-8 relative">
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-4 right-4 transition-colors ${showDevLogs ? 'text-cyan-400 bg-cyan-950/20' : 'text-gray-600'}`}
              onClick={() => setShowDevLogs(!showDevLogs)}
              title="Toggle Dev Logs"
            >
              <Bug className="h-5 w-5" />
            </Button>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Legal Document AI Analyst
            </CardTitle>
            <CardDescription className="text-gray-400">
              Advanced multi-agent pipeline for legal risk detection.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="contract-file" className="text-gray-300">Upload Contract (.pdf)</Label>
              <div className="flex gap-2">
                <Input
                  id="contract-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="bg-gray-800 border-gray-700 focus:border-indigo-500 transition-colors"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleAudit}
                  disabled={isProcessing || !file}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all px-8"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Auditing...
                    </>
                  ) : "Audit Contract"}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <input
                type="checkbox"
                id="test-mode"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                disabled={isProcessing}
              />
              <Label htmlFor="test-mode" className="text-xs text-gray-400 cursor-pointer select-none">
                Test Mode (uses mock data, no API cost)
              </Label>
            </div>

            {isProcessing || currentStage !== "idle" ? (
              <div className="bg-gray-800/20 rounded-xl p-6 border border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Pipeline Status</h3>
                <ProcessingStepper currentStage={currentStage} statusMessage={statusMessage} />
              </div>
            ) : null}

            {auditResult && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Label className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Analysis Result</Label>
                <Textarea
                  placeholder="Audit results will be displayed here."
                  value={auditResult}
                  readOnly
                  className="min-h-[300px] bg-gray-950 border-gray-800 text-green-400 font-mono text-sm focus:ring-0 resize-none whitespace-pre"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gray-800/30 border-t border-gray-800 py-4">
            <p className="text-[10px] text-gray-500">
              AI-driven legal analysis can contain errors. Not a substitute for professional legal advice.
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Sidebar with Dev Logs and ADHD Dump */}
      {showDevLogs && (
        <div className="w-[450px] h-screen animate-in slide-in-from-right duration-500 ease-out border-l border-indigo-500/20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden bg-black">
          <div className="flex-1 overflow-hidden min-h-[40%]">
            <DevLogWindow logs={logs} />
          </div>
          <div className="h-[250px] shrink-0">
            <ADHDDumpWindow />
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f2937;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

export default App;
