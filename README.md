# 🌱 PlantHealth AI: A Software Engineering Approach to Deep Learning

![PlantHealth AI](https://img.shields.io/badge/Status-Completed-success) ![Python](https://img.shields.io/badge/Python-3.8%2B-blue) ![PyTorch](https://img.shields.io/badge/PyTorch-Deep_Learning-EE4C2C) ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)

PlantHealth AI is an academic project that bridges the gap between **Artificial Intelligence** and formal **Software Engineering (SE)** methodologies. While most AI projects focus solely on model accuracy, this project treats the Neural Network as a software component, applying rigorous SE testing, quality assurance, and project management metrics.

## ✨ Features
*   **Real-time Inference**: Upload leaf images and get instant disease predictions with confidence scores.
*   **SE Quality Assurance Dashboard**: Actively manipulate input images (rotation, brightness, flips) to test the model's boundaries.
*   **Inference Latency Tracking**: Real-time performance monitoring of the PyTorch processing pipeline.
*   **COCOMO Project Estimation**: Embedded dashboard detailing the mathematical cost and effort estimations of the project's development.
*   **Glassmorphism UI**: A premium, modern, non-blocking user interface built with Vanilla JS and CSS.

---

## 📚 Software Engineering Implementation (Syllabus Mapping)

This project strictly adheres to academic SE principles:

1.  **Software Requirements (Module 2)**
    *   *Functional*: Predict plant diseases using a Convolutional Neural Network.
    *   *Non-Functional*: Monitor and display **Inference Latency** in milliseconds to ensure system responsiveness.
2.  **Design Concepts (Module 3)**
    *   Implemented a strict **Client-Server Architecture**. The heavy tensor computations are abstracted away in a FastAPI backend, keeping the frontend completely stateless.
3.  **Testing & Quality Management (Module 4)**
    *   **Black Box Testing & Metamorphic Testing**: Users can dynamically apply "Horizontal Flips" to inputs. A valid model should retain its prediction despite spatial transformations.
    *   **Boundary Value Analysis**: Using the UI sliders, testers can push inputs to absolute boundaries (e.g., Pitch Black images, Blinding Light images) to stress-test the model's robustness and gracefully catch Out-of-Distribution failures.
4.  **Software Project Management (Module 5)**
    *   **Basic COCOMO (Organic Mode)** was used for effort estimation.
    *   *Project Size*: ~1.5 KLOC
    *   *Estimated Effort*: 3.7 Person-Months
    *   *Development Time*: 4.1 Months
    *   *Team Size*: 1 Developer

---

## 🛠️ Tech Stack
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (Glassmorphism aesthetics)
*   **Backend:** Python, FastAPI, Uvicorn
*   **Machine Learning:** PyTorch, Torchvision (4-Block Custom CNN Architecture)
*   **Image Processing:** Pillow (PIL)

---

## 🚀 Getting Started

### Prerequisites
*   Python 3.8+
*   PyTorch
*   FastAPI & Uvicorn
*   Python-Multipart (for file uploads)

### Installation & Execution
1. Clone this repository to your local machine.
2. Install the required dependencies:
   ```bash
   pip install torch torchvision torchaudio fastapi uvicorn python-multipart Pillow
   ```
3. Ensure the trained weights file (`suspect_model.pth`) is located in the root directory.
4. Start the FastAPI server:
   ```bash
   uvicorn app:app --reload
   ```
5. Open your browser and navigate to: **`http://127.0.0.1:8000`**

---

## 📝 License
This project was developed as an academic submission for Software Engineering.
