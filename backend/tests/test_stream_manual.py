import urllib.request
import urllib.parse
import sys

API_URL = "http://127.0.0.1:8000/analyze-contract-stream/?test_mode=true"

def test_stream():
    print(f"Connecting to {API_URL}...")
    
    # Simple multipart form data construction is painful with urllib, 
    # but we can try just sending a POST with the prompt params if possible? 
    # No, the endpoint expects 'file'.
    
    # Let's construct a minimal body.
    boundary = '---BOUNDARY12345'
    
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 600 800]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n70 700 Td\n/F1 24 Tf\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000157 00000 n\n0000000302 00000 n\n0000000390 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n492\n%%EOF"
    
    # Body parts
    body = []
    body.append(f'--{boundary}'.encode('utf-8'))
    body.append(f'Content-Disposition: form-data; name="file"; filename="test.pdf"'.encode('utf-8'))
    body.append('Content-Type: application/pdf'.encode('utf-8'))
    body.append(b'')
    body.append(pdf_content)
    body.append(f'--{boundary}--'.encode('utf-8'))
    body.append(b'')
    
    body_bytes = b'\r\n'.join(body)
    
    req = urllib.request.Request(API_URL, data=body_bytes, method="POST")
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Stream started. Listening for chunks...")
            while True:
                chunk = response.readline()
                if not chunk:
                    break
                print(f"Received: {chunk.decode('utf-8').strip()}")
                
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_stream()
