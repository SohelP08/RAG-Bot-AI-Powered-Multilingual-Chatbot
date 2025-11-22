# Use official Python 3.10 slim image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Copy all your project files to container
COPY . /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install all required Python packages
RUN pip install --no-cache-dir flask flask-cors sentence-transformers transformers langchain faiss-cpu numpy requests

# Expose port 5000
EXPOSE 5000

# Run your Flask app
CMD ["python", "app.py"]
