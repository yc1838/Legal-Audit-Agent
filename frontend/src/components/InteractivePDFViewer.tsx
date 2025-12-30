import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2 } from "lucide-react";
import { AuditError } from './ErrorListPanel';

// Configure worker for Vite using CDN to avoid local build issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InteractivePDFViewerProps {
    file: File;
    errors: AuditError[];
    selectedErrorIndex: number | null;
}

export const InteractivePDFViewer = forwardRef<{ scrollToPage: (page: number) => void }, InteractivePDFViewerProps>(
    ({ file, errors, selectedErrorIndex }, ref) => {
        const [numPages, setNumPages] = useState<number>(0);
        const [scale, setScale] = useState(1.2);
        const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

        useImperativeHandle(ref, () => ({
            scrollToPage: (pageNumber: number) => {
                const pageEl = pageRefs.current.get(pageNumber);
                if (pageEl) {
                    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }));

        function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
            setNumPages(numPages);
        }

        // Effect to handle external selection (clicking error card)
        useEffect(() => {
            if (selectedErrorIndex !== null && errors[selectedErrorIndex]) {
                // Parse page number from location string "Page X, Section Y"
                const location = errors[selectedErrorIndex].location;
                const match = location.match(/Page\s+(\d+)/i);
                if (match) {
                    const pageNum = parseInt(match[1]);
                    const pageEl = pageRefs.current.get(pageNum);
                    if (pageEl) {
                        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Add a temporary highlight class to the page container
                        pageEl.classList.add('ring-4', 'ring-red-500', 'transition-all', 'duration-500');
                        setTimeout(() => {
                            pageEl.classList.remove('ring-4', 'ring-red-500');
                        }, 2000);
                    }
                }
            }
        }, [selectedErrorIndex, errors]);

        // Custom text renderer for highlighting (basic implementation)
        // In a real scenario, this requires robust string matching across spans.
        // For now, we will rely on page-level scrolling and basic containment.

        return (
            <div className="h-full overflow-y-auto bg-gray-900/50 p-4 rounded-xl custom-scrollbar">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error("PDF Load Error:", error)}
                    loading={
                        <div className="flex items-center justify-center h-full text-white">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            Loading PDF...
                        </div>
                    }
                    className="flex flex-col items-center gap-4"
                >
                    {Array.from(new Array(numPages), (el, index) => (
                        <div
                            key={`page_${index + 1}`}
                            ref={(el) => {
                                if (el) pageRefs.current.set(index + 1, el);
                                else pageRefs.current.delete(index + 1);
                            }}
                            className="relative shadow-2xl transition-all duration-300"
                        >
                            <Page
                                pageNumber={index + 1}
                                scale={scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="rounded-lg overflow-hidden border border-gray-800"
                            />

                            {/* Overlay for generic error indication on this page */}
                            {errors.map((err, errIdx) => {
                                const match = err.location.match(/Page\s+(\d+)/i);
                                if (match && parseInt(match[1]) === index + 1 && selectedErrorIndex === errIdx) {
                                    return (
                                        <div key={errIdx} className="absolute inset-0 bg-red-500/10 pointer-events-none border-2 border-red-500 animate-pulse rounded-lg" />
                                    );
                                }
                                return null;
                            })}
                        </div>
                    ))}
                </Document>
            </div>
        );
    }
);

InteractivePDFViewer.displayName = "InteractivePDFViewer";
