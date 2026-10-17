FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
COPY dist/index.html ./dist/index.html
RUN mkdir -p /app/data
EXPOSE 8000
CMD ["python", "-m", "backend.serve"]
