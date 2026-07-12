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

# Puerto predeterminado (Render suele asignar el puerto dinámicamente mediante $PORT)
ENV PORT=8000

# Comando para arrancar el servidor con gunicorn
CMD gunicorn --bind 0.0.0.0:$PORT app:app
