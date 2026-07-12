FROM python:3.10-slim

# Instalar dependencias del sistema (ffmpeg) y limpiar caché de apt
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todos los archivos del proyecto al contenedor
COPY . .

# Asegurar que existan los directorios necesarios
RUN mkdir -p videogame

# Exponer el puerto
EXPOSE 8000

# Habilitar la salida instantánea de logs en Docker/Render
ENV PYTHONUNBUFFERED=1

# Comando para arrancar el servidor con gunicorn capturando los prints de la app
CMD gunicorn --bind 0.0.0.0:$PORT --capture-output --log-level info app:app
