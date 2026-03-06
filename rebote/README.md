# Like vs Lemons 🍋👍

Un minijuego automático diseñado para crear contenido viral estilo TikTok o Shorts. El juego consiste en un icono de "Like" que rebota entre dos limones gigantes.

## 🎮 De qué va el juego

El juego es una simulación física donde:
- Un **icono de "Like"** cae por gravedad.
- **Dos limones gigantes** giran en la parte inferior, creando un espacio estrecho.
- El objetivo (automático) es que el Like rebote el mayor tiempo posible entre los limones.
- Cada rebote aumenta la puntuación de "Likes".
- Si el Like cae por debajo de los limones, el juego termina.

## 🚀 Características

- **Formato Vertical**: Optimizado para 1080x1920 (9:16), ideal para redes sociales.
- **Grabación Automática**: El juego empieza a grabar la sesión en cuanto se carga la página.
- **Interfaz Limpia**: Diseñado para ser visualmente atractivo y fácil de entender.
- **Física Realista**: Rebotes calculados con damping y gravedad.

## 🛠️ Cómo usarlo

1. Abre `index.html` en cualquier navegador web moderno.
2. El juego comenzará automáticamente.
3. Al perder (Game Over), se descargará automáticamente un archivo de video con la partida grabada.
4. Si el video se descarga en formato `.webm` y necesitas `.mp4`, puedes usar el script de utilidad incluido.

## 📂 Archivos del Proyecto

- `index.html`: Estructura del juego y contenedor del Canvas.
- `style.css`: Estilos visuales y tipografía (Inter).
- `script.js`: Lógica del juego, físicas, dibujo y sistema de grabación.
- `convert_to_mp4.py`: Script de Python útil para convertir grabaciones de `.webm` a `.mp4` usando FFmpeg.

## 📋 Requisitos

- Solo un navegador web para jugar.
- Python y FFmpeg (opcional) si deseas usar el script de conversión.
