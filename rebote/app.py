from flask import Flask, request, jsonify, send_from_directory
import os
import subprocess
import threading
import requests
from pathlib import Path
import time

app = Flask(__name__, static_folder='.', static_url_path='')

# Configuración desde Variables de Entorno (o valores por defecto si se corre local)
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
# KEEP_LOCAL_FILES: por defecto es false en la nube para ahorrar espacio, pero puede ser true
KEEP_LOCAL_FILES = os.environ.get("KEEP_LOCAL_FILES", "false").lower() == "true"

VIDEOGAME_DIR = Path("videogame").resolve()
VIDEOGAME_DIR.mkdir(parents=True, exist_ok=True)

# Rutas explícitas para servir los archivos del juego
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

@app.route('/style.css')
def style():
    return send_from_directory('.', 'style.css')

def send_to_telegram(video_path):
    """Envía el archivo de video a Telegram usando la API de Bots."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
    print(f"[Telegram] Enviando {video_path.name} a Telegram...")
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {
                'video': (video_path.name, video_file, 'video/mp4')
            }
            data = {
                'chat_id': TELEGRAM_CHAT_ID,
                'caption': f"🎬 ¡Nuevo Gameplay Diario! Grabado el {time.strftime('%d/%m/%Y a las %H:%M:%S')}"
            }
            # Timeout de 90 segundos para permitir subir archivos grandes
            response = requests.post(url, files=files, data=data, timeout=90)
            
        if response.status_code == 200:
            print("[Telegram] ¡Video enviado exitosamente a tu teléfono!")
            return True
        else:
            print(f"[Telegram] Error al enviar video: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[Telegram] Error de red al intentar enviar a Telegram: {e}")
        return False

def process_video_async(webm_path_str, filename):
    """Función que corre en segundo plano para convertir el video y enviarlo."""
    webm_path = Path(webm_path_str)
    mp4_filename = f"{webm_path.stem}.mp4"
    mp4_path = VIDEOGAME_DIR / mp4_filename
    
    print(f"[Procesador] Iniciando conversión de {webm_path.name} a MP4...")
    
    # Comando de FFmpeg para codificar a MP4 (H.264 + AAC) compatible con smartphones
    cmd = [
        'ffmpeg',
        '-i', str(webm_path),
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'veryfast',      # Codificación ultrarrápida que consume muchísima menos memoria RAM
        '-crf', '28',               # Nivel de compresión optimizado para bajo peso de archivo
        '-y',
        str(mp4_path)
    ]
    
    try:
        # Ejecutar FFmpeg
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[Procesador] Conversión completada con éxito: {mp4_path.name}")
            
            sent_to_telegram = False
            # Intentar enviar a Telegram si los datos están configurados
            if TELEGRAM_TOKEN and TELEGRAM_CHAT_ID:
                sent_to_telegram = send_to_telegram(mp4_path)
            else:
                print("[Procesador] Telegram no configurado. El archivo MP4 se conservará localmente.")
            
            # Limpieza del archivo WebM temporal original (ya no es necesario)
            if webm_path.exists():
                webm_path.unlink()
                print(f"[Procesador] Archivo WebM temporal eliminado: {webm_path.name}")
                
            # Limpieza del archivo MP4 si ya se envió y no se desea mantener copias en el disco local
            if sent_to_telegram and not KEEP_LOCAL_FILES:
                if mp4_path.exists():
                    mp4_path.unlink()
                    print(f"[Procesador] Archivo MP4 temporal eliminado del servidor para ahorrar espacio: {mp4_path.name}")
        else:
            print(f"[Procesador] FFmpeg devolvió un error (código {result.returncode}):\n{result.stderr}")
    except Exception as e:
        print(f"[Procesador] Error inesperado en el hilo de procesamiento: {e}")

@app.route('/upload', methods=['POST'])
def upload():
    """Recibe la grabación en formato WebM directamente desde el navegador del móvil."""
    filename = request.headers.get('X-Filename')
    if not filename:
        filename = f"rebote_gameplay_{int(time.time() * 1000)}.webm"
        
    # Sanitizar nombre del archivo
    filename = os.path.basename(filename)
    webm_path = VIDEOGAME_DIR / filename
    
    print(f"\n[Servidor] Recibiendo grabación desde el navegador: {filename} ({request.content_length} bytes)...")
    
    try:
        # Transmitir el cuerpo binario de la petición directamente al disco (eficiente en memoria)
        with open(webm_path, 'wb') as f:
            chunk_size = 64 * 1024
            while True:
                chunk = request.stream.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                
        print(f"[Servidor] Archivo guardado temporalmente: {webm_path.name}")
        
        # Arrancar hilo en segundo plano para no bloquear la respuesta HTTP
        thread = threading.Thread(target=process_video_async, args=(str(webm_path), filename))
        thread.start()
        
        return jsonify({"status": "received", "message": "Video subido e iniciando procesamiento."}), 200
        
    except Exception as e:
        print(f"[Servidor] Error al guardar la grabación subida: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Modo de ejecución local
    port = int(os.environ.get("PORT", 8000))
    print(f"Servidor iniciado localmente. Accede a http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
