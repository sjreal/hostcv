# Stage 1: Build the dependencies in a dedicated builder stage
FROM python:3.12-slim as builder

# Copy the uv binary from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/

# Set the working directory
WORKDIR /app

# Create a virtual environment
RUN uv venv /opt/venv

# Copy the CPU-only requirements file
COPY Backend/requirements-cpu.txt ./

# Activate the venv and install dependencies with `uv pip install`
# This is a more explicit alternative to `uv sync`
# Using CPU-only PyTorch to avoid heavy CUDA dependencies
RUN . /opt/venv/bin/activate && uv pip install --no-cache -r requirements-cpu.txt

# --- DEBUGGING STEP ---
# List the contents of the venv bin and the installed packages
RUN echo "--- VENV BIN CONTENTS ---" && ls -la /opt/venv/bin
RUN echo "--- INSTALLED PACKAGES ---" && /opt/venv/bin/uv pip list

# Stage 2: Create the final, lean production image
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Add the venv to the PATH
ENV PATH="/opt/venv/bin:$PATH"

# Copy the application code
COPY Backend/app ./app
COPY Backend/schemas ./schemas

# Expose the port
EXPOSE 8000

# Define the command to run the Uvicorn server as a Python module
CMD ["/opt/venv/bin/python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]