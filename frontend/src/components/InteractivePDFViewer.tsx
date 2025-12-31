import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2 } from "lucide-react";
import { AuditError } from './ErrorListPanel';

// Configure worker for Vite using local public file
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface InteractivePDFViewerProps {
    file: File;
    errors: AuditError[];
    selectedErrorIndex: number | null;
}

export const InteractivePDFViewer = forwardRef<{ scrollToPage: (page: number) => void }, InteractivePDFViewerProps>(
    ({ file, errors, selectedErrorIndex }, ref) => {
        const [numPages, setNumPages] = useState<number>(0);
        const [containerWidth, setContainerWidth] = useState<number>(0);
        const containerRef = useRef<HTMLDivElement>(null);
        const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

        useImperativeHandle(ref, () => ({
            scrollToPage: (pageNumber: number) => {
                const pageEl = pageRefs.current.get(pageNumber);
                if (pageEl) {
                    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }));

        // ResizeObserver to handle responsive fitting
        useEffect(() => {
            if (!containerRef.current) return;

            const observer = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (entry) {
                    // Subtract padding (32px for p-4) to fit perfectly
                    setContainerWidth(entry.contentRect.width);
                }
            });

            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }, []);

        function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
            setNumPages(numPages);
        }

        // Effect to handle external selection (clicking error card)
        useEffect(() => {
            if (selectedErrorIndex !== null && errors[selectedErrorIndex]) {
                const location = errors[selectedErrorIndex].location;
                // Match "Page 5", "page 5", "Page: 5", "pg 5"
                const match = location.match(/(?:Page|pg)[:\s]+(\d+)/i);
                if (match) {
                    const pageNum = parseInt(match[1]);
                    const pageEl = pageRefs.current.get(pageNum);
                    if (pageEl) {
                        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        pageEl.classList.add('ring-4', 'ring-red-500', 'transition-all', 'duration-500');
                        setTimeout(() => {
                            pageEl.classList.remove('ring-4', 'ring-red-500');
                        }, 2000);
                    }
                }
            }
        }, [selectedErrorIndex, errors]);

        return (
            <div ref={containerRef} className="h-full overflow-y-auto bg-gray-900/50 p-4 rounded-xl custom-scrollbar relative">
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
                            style={{ width: containerWidth ? containerWidth : 'auto' }}
                        >
                            <Page
                                pageNumber={index + 1}
                                width={containerWidth || undefined}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="rounded-lg overflow-hidden border border-gray-800 bg-white"
                            />

                            {/* Precise Highlights Overlay */}
                            {errors.map((err, errIdx) => {
                                const errLocation = err.location || "";
                                const match = errLocation.match(/Page\s+(\d+)/i);
                                const pageNum = match ? parseInt(match[1]) : -1;
                                const isSelected = selectedErrorIndex === errIdx;

                                if (pageNum !== index + 1) return null;

                                // Strategy 1: Use Bounding Boxes if available
                                if (err.boundingBoxes && err.boundingBoxes.length > 0) {
                                    return err.boundingBoxes.map((rect: any, rIdx: number) => {
                                        // Calculate scale factor: Rendered Width / Original PDF Point Width
                                        // If containerWidth is not yet set, default to 1 (or 1.25 roughly).
                                        // We safely handle missing page_width by defaulting to A4 (595).
                                        const pdfPageWidth = rect.page_width || 595;
                                        const scaleFactor = containerWidth ? (containerWidth / pdfPageWidth) : 1;

                                        return (
                                            <div
                                                key={`${errIdx}-${rIdx}`}
                                                className={`absolute transition-all duration-300 ${isSelected ? 'bg-red-500/30 border-2 border-red-500 z-10' : 'bg-yellow-500/20 border border-yellow-500/50'}`}
                                                style={{
                                                    left: `calc(${rect.x}px * ${scaleFactor})`,
                                                    top: `calc(${rect.y}px * ${scaleFactor})`,
                                                    width: `calc(${rect.width}px * ${scaleFactor})`,
                                                    height: `calc(${rect.height}px * ${scaleFactor})`,
                                                }}
                                            />
                                        )
                                    });
                                }

                                // Strategy 2: Fallback to full page highlight
                                if (isSelected) {
                                    return (
                                        <div key={errIdx} className="absolute inset-0 bg-red-500/10 pointer-events-none border-2 border-red-500 rounded-lg" />
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
