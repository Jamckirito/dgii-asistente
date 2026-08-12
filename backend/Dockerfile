FROM python:3.12-slim

# Evitar escritura de bytecode de python (.pyc) y forzar salida sin buffer
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY . .

# Puerto por defecto (los proveedores en la nube como Railway/Render setean PORT dinámicamente)
ENV PORT=8000
EXPOSE 8000

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
