import http.server
import socketserver
import os
import urllib.parse
from pathlib import Path
import webbrowser
import time

PORT = 8000
DIRECTORY = Path(__file__).parent.resolve()
VIDEOGAME_DIR = DIRECTORY / "videogame"

class GameHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/upload':
            content_length = int(self.headers['Content-Length'])
            filename = self.headers.get('X-Filename', f'rebote_gameplay_{int(time.time() * 1000)}.webm')
            
            # Evitar vulnerabilidad de directory traversal
            filename = os.path.basename(filename)
            file_path = VIDEOGAME_DIR / filename
            
            # Asegurar que el directorio de destino existe
            VIDEOGAME_DIR.mkdir(parents=True, exist_ok=True)
            
            print(f"\n[Servidor] Recibiendo video ({content_length} bytes)...")
            try:
                with open(file_path, 'wb') as f:
                    remaining = content_length
                    chunk_size = 64 * 1024
                    while remaining > 0:
                        chunk = self.rfile.read(min(remaining, chunk_size))
                        if not chunk:
                            break
                        f.write(chunk)
                        remaining -= len(chunk)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"status": "success"}')
                print(f"[Servidor] ¡Video guardado exitosamente en: {file_path}!\n")
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'{{"error": "{str(e)}"}}'.encode())
                print(f"[Servidor] Error al guardar el video: {e}\n")
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        # Soporte de CORS en caso de que se necesite
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Filename, Content-Type')
        self.end_headers()

def run_server():
    # Asegurar que el directorio videogame existe
    VIDEOGAME_DIR.mkdir(parents=True, exist_ok=True)
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), GameHTTPRequestHandler) as httpd:
        print("=" * 60)
        print(f"Servidor local del juego iniciado en: http://localhost:{PORT}")
        print(f"Los videos se guardarán directamente en: {VIDEOGAME_DIR}")
        print("Para detener el servidor presiona Ctrl+C en esta terminal.")
        print("=" * 60)
        
        # Abrir el navegador automáticamente a los 500ms
        webbrowser.open(f"http://localhost:{PORT}")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido por el usuario.")

if __name__ == "__main__":
    run_server()
