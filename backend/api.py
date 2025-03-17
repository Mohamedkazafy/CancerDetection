import kagglehub
import pandas as pd
from PIL import Image
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import sklearn
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

print("Downloading dataset from Kaggle...")
dataset_path = kagglehub.dataset_download("andrewmvd/leukemia-classification")
print("Path to dataset files:", dataset_path)

print(f"Using scikit-learn version: {sklearn.__version__}")

validation_csv = os.path.join(dataset_path, "C-NMC_Leukemia/validation_data/C-NMC_test_prelim_phase_data_labels.csv")
validation_img_dir = os.path.join(dataset_path, "C-NMC_Leukemia/validation_data/C-NMC_test_prelim_phase_data")

x = pd.read_csv(validation_csv)
x = x.dropna(axis=0)

print("Class distribution:\n", x["labels"].value_counts())

target = x["labels"]
features = []

for img_data in x["new_names"]:
    path = os.path.join(validation_img_dir, img_data)
    img = Image.open(path).convert("L")
    img = img.resize((128, 128))
    img_array = np.array(img)
    features.append(img_array)

features = np.array(features, dtype='float32') / 255.0
features = features.reshape(features.shape[0], -1)
train_X, val_X, train_y, val_y = train_test_split(features, target, test_size=0.2, random_state=1)

blood_cancer_model = RandomForestClassifier(
    n_estimators=100,
    random_state=1,
    class_weight="balanced",
    n_jobs=-1
)

blood_cancer_model.fit(train_X, train_y)

prediction_best = blood_cancer_model.predict(val_X)
print("Confusion Matrix:\n", confusion_matrix(val_y, prediction_best))
print("Classification Report:\n", classification_report(val_y, prediction_best))

joblib.dump(blood_cancer_model, 'blood_cancer_model.pkl')
print("Model saved as 'blood_cancer_model.pkl'")

app = FastAPI(title="Blood Cancer Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000", 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load('blood_cancer_model.pkl')

def process_image(image_file):
    """Process uploaded image and prepare it for prediction"""
    img = Image.open(image_file).convert("L")
    img = img.resize((128, 128))
    img_array = np.array(img, dtype='float32') / 255.0
    img_array = img_array.reshape(1, -1)
    return img_array

@app.post("/predict/")
async def predict_blood_cancer(file: UploadFile = File(...)):
    """Endpoint to predict blood cancer from uploaded image"""
    try:
        img_array = process_image(file.file)
        prediction = model.predict(img_array)
        result = "Cancer Detected" if prediction[0] == 1 else "No Cancer Detected"
        probability = model.predict_proba(img_array)[0]
        confidence = float(max(probability))
        
        return {
            "prediction": result,
            "confidence": confidence,
            "status": "success"
        }
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "sklearn_version": sklearn.__version__}

def predict_blood_cancer_local(image_path):
    with open(image_path, 'rb') as image_file:
        img_array = process_image(image_file)
        prediction = model.predict(img_array)
        result = "Cancer Detected" if prediction[0] == 1 else "No Cancer Detected"
        return result

if __name__ == "__main__":
    sample_image = os.path.join(dataset_path, "C-NMC_Leukemia/training_data/fold_0/hem/UID_H12_1_1_hem.bmp")
    if os.path.exists(sample_image):
        result = predict_blood_cancer_local(sample_image)
        print(f"Prediction: {result}")
    else:
        print("Sample image not found for testing")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)