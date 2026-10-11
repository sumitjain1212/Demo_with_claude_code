FROM python:3.12-slim

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate the default sample workbook at build time
RUN python data/generator.py

# Switch to non-root
USER appuser

EXPOSE 6000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:6000/health')"

CMD ["gunicorn", "--bind", "0.0.0.0:6000", "--workers", "2", "--timeout", "60", "wsgi:app"]
