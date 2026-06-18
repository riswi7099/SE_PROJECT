import io
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import torchvision.transforms.functional as TF
import base64
import time
import os
from fastapi.responses import FileResponse

# 1. Define Model Architecture (Must match the training phase exactly)
class PlantDiseaseCNN_Advanced(nn.Module):
    def __init__(self, num_classes):
        super(PlantDiseaseCNN_Advanced, self).__init__()

        self.features = nn.Sequential(
            # Block 1: 32 Channels
            nn.Conv2d(3, 32, kernel_size=3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
            nn.Conv2d(32, 32, kernel_size=3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 2: 64 Channels
            nn.Conv2d(32, 64, kernel_size=3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 3: 128 Channels
            nn.Conv2d(64, 128, kernel_size=3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
            nn.Conv2d(128, 128, kernel_size=3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 4: 256 Channels
            nn.Conv2d(128, 256, kernel_size=3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
            nn.Conv2d(256, 256, kernel_size=3, padding=1), nn.BatchNorm2d(256), nn.ReLU(),

            # Global Average Pooling
            nn.AdaptiveAvgPool2d((1, 1))
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.5),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        return self.classifier(self.features(x))

# 2. Setup Application and Load Model
app = FastAPI(title="Plant Disease Predictor")

# The 29 classes derived from the dataset
CLASS_NAMES = [
    'Apple___Apple Scab', 'Apple___Black Rot', 'Apple___Cedar Apple Rust', 'Apple___Healthy',
    'Bell Pepper___Bacterial Spot', 'Bell Pepper___Healthy', 'Cherry___Healthy', 'Cherry___Powdery Mildew',
    'Corn (Maize)___Cercospora Leaf Spot', 'Corn (Maize)___Common Rust', 'Corn (Maize)___Healthy', 'Corn (Maize)___Northern Leaf Blight',
    'Grape___Black Rot', 'Grape___Esca (Black Measles)', 'Grape___Healthy', 'Grape___Leaf Blight',
    'Peach___Bacterial Spot', 'Peach___Healthy', 'Potato___Early Blight', 'Potato___Healthy',
    'Potato___Late Blight', 'Strawberry___Healthy', 'Strawberry___Leaf Scorch', 'Tomato___Bacterial Spot',
    'Tomato___Early Blight', 'Tomato___Healthy', 'Tomato___Late Blight', 'Tomato___Septoria Leaf Spot',
    'Tomato___Yellow Leaf Curl Virus'
]
NUM_CLASSES = len(CLASS_NAMES)

# Initialize device and model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = PlantDiseaseCNN_Advanced(NUM_CLASSES).to(device)

try:
    # Use map_location=device to support both CPU and GPU
    model.load_state_dict(torch.load("suspect_model.pth", map_location=device))
    model.eval()
    print(f"Model loaded successfully on {device}.")
except Exception as e:
    print(f"Failed to load model: {e}")

# 3. Define the evaluation transform (NO random augmentation here)
test_transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])

# 4. Endpoints
# Mount static directory for frontend files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/download_defects")
async def download_defects():
    file_path = "final_defect_reports.zip"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/zip", filename="final_defect_reports.zip")
    return {"error": "Defect reports not found"}

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("static/index.html", "r") as f:
        return f.read()

@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...), 
    rotation: float = Form(0.0), 
    brightness: float = Form(1.0),
    flip: bool = Form(False)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        # Read the image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Transform the image (base 128x128 transform)
        img_tensor = test_transform(image)
        
        # Apply Manual Mutations
        if flip:
            img_tensor = TF.hflip(img_tensor)
        
        if brightness != 1.0:
            img_tensor = TF.adjust_brightness(img_tensor, brightness)
            
        if rotation != 0.0:
            img_tensor = TF.rotate(img_tensor, rotation)

        # Convert back to base64 image for frontend visualization
        img_pil = TF.to_pil_image(img_tensor)
        buffered = io.BytesIO()
        img_pil.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        # Predict
        img_tensor = img_tensor.unsqueeze(0).to(device)
        start_time = time.time()
        with torch.no_grad():
            output = model(img_tensor)
            _, predicted_idx = torch.max(output, 1)
            predicted_class = CLASS_NAMES[predicted_idx.item()]
            
            # Optionally return confidence
            probabilities = torch.nn.functional.softmax(output, dim=1)[0]
            confidence = probabilities[predicted_idx].item() * 100
        end_time = time.time()
        latency_ms = (end_time - start_time) * 1000

        return {
            "prediction": predicted_class,
            "confidence": f"{confidence:.2f}%",
            "mutated_image": f"data:image/jpeg;base64,{img_base64}",
            "latency_ms": latency_ms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
