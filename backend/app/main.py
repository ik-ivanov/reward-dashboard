"""Main FastAPI application with CORS configuration."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .database import init_db

app = FastAPI(
    title="Reward Dashboard API",
    description="API for managing colleague badges and rewards",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")


@app.on_event("startup")
def on_startup():
    """Initialize database on startup."""
    init_db()


@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "Reward Dashboard API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
