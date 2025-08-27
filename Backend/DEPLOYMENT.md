# Deployment Instructions

To deploy the backend without installing heavy CUDA dependencies, follow these steps:

## For Docker Deployments

The provided Dockerfile has been updated to use CPU-only PyTorch and a more lightweight sentence transformer model. The Dockerfile now uses `requirements-cpu.txt` which specifies the CPU-only version of PyTorch.

To build and run:
```bash
docker build -t cv-automation-backend .
docker run -p 8000:8000 cv-automation-backend
```

## For Direct Deployment (e.g., on Heroku, Render, etc.)

When deploying to platforms that install dependencies from requirements.txt, make sure to:

1. Use the `requirements-cpu.txt` file instead of `requirements.txt`
2. Or manually ensure that PyTorch CPU-only version is installed:
   ```
   pip install torch==2.8.0+cpu --extra-index-url https://download.pytorch.org/whl/cpu
   ```

## Key Changes Made

1. **CPU-only PyTorch**: Updated dependencies to use CPU-only version of PyTorch to avoid installing CUDA libraries
2. **Lighter Sentence Transformer Model**: Changed from `all-mpnet-base-v2` to `all-MiniLM-L6-v2` which is faster and more suitable for CPU deployments
3. **Separate Requirements File**: Created `requirements-cpu.txt` specifically for CPU deployments

## Environment Variables

Ensure your environment variables are properly set, especially:
- `SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2` (already set in .env)

These changes will reduce the deployment size by approximately 1GB and significantly speed up the deployment process.