"""
Script para convertir archivos de video en la carpeta 'videogame' a formato MP4.
Requiere ffmpeg instalado en el sistema.
"""

import os
import subprocess
from pathlib import Path


def convert_to_mp4(input_folder: str, output_folder: str = None) -> None:
    """
    Convierte todos los archivos de video en la carpeta de entrada a formato MP4.
    
    Args:
        input_folder: Ruta a la carpeta con los videos a convertir
        output_folder: Ruta donde guardar los videos convertidos (opcional, 
                      por defecto usa la misma carpeta)
    """
    # Extensiones de video soportadas
    video_extensions = {'.webm', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.m4v', '.3gp'}
    
    input_path = Path(input_folder)
    output_path = Path(output_folder) if output_folder else input_path
    
    # Crear carpeta de salida si no existe
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Buscar archivos de video
    video_files = [f for f in input_path.iterdir() 
                   if f.is_file() and f.suffix.lower() in video_extensions]
    
    if not video_files:
        print(f"No se encontraron archivos de video en: {input_folder}")
        return
    
    print(f"Encontrados {len(video_files)} archivo(s) de video para convertir.\n")
    
    converted = 0
    errors = 0
    
    for video_file in video_files:
        output_file = output_path / f"{video_file.stem}.mp4"
        
        print(f"Convirtiendo: {video_file.name}")
        print(f"  -> {output_file.name}")
        
        try:
            # Comando ffmpeg para convertir a MP4
            cmd = [
                'ffmpeg',
                '-i', str(video_file),      # Archivo de entrada
                '-c:v', 'libx264',          # Codec de video H.264
                '-c:a', 'aac',              # Codec de audio AAC
                '-preset', 'medium',        # Balance entre velocidad y calidad
                '-crf', '23',               # Calidad (menor = mejor, 23 es default)
                '-y',                       # Sobrescribir sin preguntar
                str(output_file)
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"  ✓ Conversión exitosa!\n")
                converted += 1
            else:
                print(f"  ✗ Error en la conversión:")
                print(f"    {result.stderr[:200]}...\n")
                errors += 1
                
        except FileNotFoundError:
            print("  ✗ Error: ffmpeg no está instalado o no está en el PATH.")
            print("    Instala ffmpeg desde: https://ffmpeg.org/download.html")
            return
        except Exception as e:
            print(f"  ✗ Error inesperado: {e}\n")
            errors += 1
    
    print("=" * 50)
    print(f"Resumen: {converted} convertido(s), {errors} error(es)")


if __name__ == "__main__":
    # Ruta a la carpeta videogame (relativa al script)
    script_dir = Path(__file__).parent
    videogame_folder = script_dir / "videogame"
    
    print("=" * 50)
    print("Conversor de Video a MP4")
    print("=" * 50)
    print(f"Carpeta de origen: {videogame_folder}\n")
    
    convert_to_mp4(str(videogame_folder))
