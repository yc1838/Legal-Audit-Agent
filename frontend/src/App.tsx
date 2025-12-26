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

function App() {
  const [auditResult, setAuditResult] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleAudit = async () => {
    if (!file) {
      alert("Please upload a contract file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/analyze-contract/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAuditResult(JSON.stringify(data, null, 2));
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Could not analyze the contract.";
        setAuditResult(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error auditing contract:", error);
      setAuditResult("Error: Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Legal Document AI Analyst</CardTitle>
          <CardDescription>
            Your AI-powered legal assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="contract-file">Upload Contract (.pdf)</Label>
            <Input
              id="contract-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
          <Button onClick={handleAudit}>Audit Contract</Button>
          <Textarea
            placeholder="Audit results will be displayed here."
            value={auditResult}
            readOnly
            className="min-h-[200px]"
          />
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500">
            This is a demo application. Do not use for real legal advice.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
