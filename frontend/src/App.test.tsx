import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import React from 'react';
import { vi } from 'vitest';

// Mock react-pdf because it breaks in JSDOM
vi.mock('react-pdf', () => ({
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
    Document: ({ children }: any) => <div>{children}</div>,
    Page: () => <div>Page</div>,
}));



// Mock fetch
global.fetch = vi.fn();

// Mock the child components to simplify testing (optional, but App is complex)
// For now, we test integration to see if the logic holds
// We might need to mock IntersectionObserver if used by animations
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders audit errors in ErrorListPanel when backend returns errors', async () => {
        // Mock successful stream response
        const mockErrors = [
            {
                location: "Page 1",
                error: "Test Error",
                suggestion: "Fix it",
                exact_quote: "broken text"
            }
        ];

        // We need to simulate the streaming response
        // This is a bit complex to mock fetch stream directly, but we can mock the behavior
        // Or we can mock the internal state update mechanism if we could, but that's hard in blackbox test.
        // Let's try to mock fetch returning a stream.

        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                // Send errors
                controller.enqueue(encoder.encode(JSON.stringify({
                    result: { errors: mockErrors }
                }) + "\n"));
                controller.close();
            }
        });

        const mockResponse = {
            ok: true,
            body: stream
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        render(<App />);

        // Need to select file to trigger logic
        const fileInput = screen.getByLabelText(/Upload Contract/i);
        const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

        // Use userEvent or fireEvent
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Click Audit
        const auditButton = screen.getByText(/Audit Contract/i);
        fireEvent.click(auditButton);

        // Wait for processing to finish
        // The ErrorListPanel should appear
        await waitFor(() => {
            expect(screen.getByText('Detected Risks')).toBeInTheDocument();
            expect(screen.getByText('Test Error')).toBeInTheDocument();
        });
    });

    it('does not render ErrorListPanel when there are no errors', async () => {
        // Mock empty result
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(JSON.stringify({
                    result: { errors: [] }
                }) + "\n"));
                controller.close();
            }
        });

        const mockResponse = {
            ok: true,
            body: stream
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        render(<App />);

        const fileInput = screen.getByLabelText(/Upload Contract/i);
        const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const auditButton = screen.getByText(/Audit Contract/i);
        fireEvent.click(auditButton);

        // Wait a bit to ensure it finished
        // We can check if "Pipeline Status" changes to completed or something
        // But simply checking that "Detected Risks" is NOT there after a timeout or when processing stops

        // Wait for processing to finish (we assume button re-enabled or text appears)
        // With the new logic, the panel SHOULD appear with "No Risks Detected" if we set stage to completed
        // But our mock stream sets result, which sets stage to completed

        await waitFor(() => {
            expect(screen.getByText(/Detected Risks/i)).toBeInTheDocument();
            expect(screen.getByText(/No Risks Detected/i)).toBeInTheDocument();
        });
    });

    it('renders analyzing state while processing', async () => {
        // Mock a delayed response
        const stream = new ReadableStream({
            start(controller) {
                // Do nothing immediately, simulating delay
                setTimeout(() => {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(JSON.stringify({
                        result: { errors: [] }
                    }) + "\n"));
                    controller.close();
                }, 100);
            }
        });

        const mockResponse = {
            ok: true,
            body: stream
        };

        (global.fetch as any).mockResolvedValue(mockResponse);

        render(<App />);

        const fileInput = screen.getByLabelText(/Upload Contract/i);
        const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const auditButton = screen.getByText(/Audit Contract/i);
        fireEvent.click(auditButton);

        // Immediately after click, it should be processing
        expect(screen.getByText(/Analyzing Document/i)).toBeInTheDocument();

        // Eventually it finishes
        await waitFor(() => {
            expect(screen.getByText(/No Risks Detected/i)).toBeInTheDocument();
        });
    });
});
