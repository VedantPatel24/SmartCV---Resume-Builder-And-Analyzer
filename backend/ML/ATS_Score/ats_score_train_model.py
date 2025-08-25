import json
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

# ---------------------------
# Load JSON Training Data
# ---------------------------
with open("train/train_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

df = pd.DataFrame(data)

# ---------------------------
# Entity Feature Counts
# ---------------------------
def count_entity_type(entity_list, label):
    return sum(1 for ent in entity_list if ent[2] == label)

df["skill_count"] = df["entities"].apply(lambda x: count_entity_type(x, "SKILLS"))
df["education_count"] = df["entities"].apply(lambda x: count_entity_type(x, "DEGREE"))
df["college_count"] = df["entities"].apply(lambda x: count_entity_type(x, "COLLEGE_NAME"))
df["experience_count"] = df["entities"].apply(lambda x: count_entity_type(x, "YEARS_OF_EXPERIENCE"))
df["company_count"] = df["entities"].apply(lambda x: count_entity_type(x, "COMPANIES_WORKED_AT"))
df["project_count"] = df["entities"].apply(lambda x: count_entity_type(x, "PROJECT"))
df["text_length"] = df["text"].apply(len)

# ---------------------------
# 🔄 New Features (Approximated)
# ---------------------------
# df["certification_count"] = df["text"].apply(lambda x: x.lower().count("certificat"))
# df["has_summary"] = df["text"].apply(lambda x: 1 if "summary" in x.lower() else 0)

# ---------------------------
# Proxy ATS Score
# ---------------------------
df["ats_score"] = (
    0.35 * df["skill_count"] +
    0.15 * df["education_count"] +
    0.10 * df["college_count"] +
    0.15 * df["company_count"] +
    0.10 * df["experience_count"] +
    0.10 * df["project_count"] +
    # 0.05 * df["certification_count"]  +
    0.005 * df["text_length"] / 1000 
    # 0.005 * df["has_summary"]
)

# ---------------------------
# Define Features
# ---------------------------
features = [    
    "skill_count",
    "education_count",
    "college_count",
    "company_count",
    "experience_count",
    "project_count",
    # "certification_count",
    # "has_summary",
    "text_length"
]

X = df[features]
y = df["ats_score"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ---------------------------
# Train Model
# ---------------------------
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ---------------------------
# Evaluate
# ---------------------------
preds = model.predict(X_test)
mse = mean_squared_error(y_test, preds)
r2 = r2_score(y_test, preds)

print("✅ Retrained Model Successfully!")
print(f"📊 Mean Squared Error: {mse:.4f}")
print(f"📈 R^2 Score: {r2:.4f}")

# ---------------------------
# Save New Model
# ---------------------------
os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/ats_score_model.pkl")
print("💾 New model saved to model/ats_score_model_v2.pkl")

# ---------------------------
# Optional Save Processed CSV
# ---------------------------
df.to_csv("train/processed_resume_data.csv", index=False)
print("📁 Processed data saved to processed_resume_data_v2.csv")
