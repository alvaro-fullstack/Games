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

### Método 1: Guardado Automático en la carpeta `videogame` (Recomendado)
Para que los videos se guarden directamente en la carpeta `videogame` de la raíz sin tener que moverlos manualmente:
1. Ejecuta el servidor local con el siguiente comando en tu terminal:
   ```bash
   python server.py
   ```
2. Esto abrirá automáticamente el juego en tu navegador (`http://localhost:8000`).
3. Juega o deja que la simulación termine. Al dar "Game Over", el video se guardará automáticamente en la carpeta `videogame` en formato `.webm`.

### Método 2: Ejecución Directa (Guardado en Descargas)
Si prefieres no usar el servidor de Python:
1. Abre `index.html` directamente en tu navegador web.
2. El juego comenzará automáticamente.
3. Al perder (Game Over), el archivo de video se descargará automáticamente en tu carpeta de **Descargas** (Downloads) de tu sistema operativo como antes.

### 🔄 Conversión a MP4
Si los videos se guardan en formato `.webm` y necesitas `.mp4` con excelente compatibilidad, puedes usar el script de utilidad incluido:
```bash
python convert_to_mp4.py
```

## 📂 Archivos del Proyecto

- `index.html`: Estructura del juego y contenedor del Canvas.
- `style.css`: Estilos visuales y tipografía (Inter).
- `script.js`: Lógica del juego, físicas, dibujo y sistema de grabación.
- `convert_to_mp4.py`: Script de Python útil para convertir grabaciones de `.webm` a `.mp4` usando FFmpeg.

## 📋 Requisitos

- Solo un navegador web para jugar.
- Python y FFmpeg (opcional) si deseas usar el script de conversión.
