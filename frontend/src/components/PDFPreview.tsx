import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";

interface PDFPreviewProps {
    file: File;
}

export function PDFPreview({ file }: PDFPreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string>("");

    useEffect(() => {
        if (!file) return;

        const url = URL.createObjectURL(file);
        // Add PDF parameters to control view
        // navpanes=0: Hide sidebar
        // toolbar=0: Hide toolbar
        // view=FitH: Fit to width
        setObjectUrl(`${url}#navpanes=0&toolbar=0&view=FitH`);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    if (!objectUrl) return null;

    return (
        <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-xl overflow-hidden flex flex-col">
            <div className="flex-1 bg-white">
                <iframe
                    src={objectUrl}
                    className="w-full h-full"
                    title="PDF Preview"
                />
            </div>
        </Card>
    );
}
