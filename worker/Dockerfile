# syntax=docker/dockerfile:1
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr tesseract-ocr-eng tesseract-ocr-fra tesseract-ocr-deu \
    build-essential pkg-config && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir PyMuPDF==1.26.7 pdfminer.six==20240706 psycopg[binary]==3.2.1 requests==2.32.3 pydantic==2.9.2

WORKDIR /app
COPY app/ /app/
ENV PYTHONUNBUFFERED=1
CMD ["python", "-m", "main"]

