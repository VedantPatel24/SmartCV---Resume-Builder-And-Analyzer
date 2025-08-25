# NEW 10,000 rows dataset ml ( batch - 1,2000)

import pandas as pd
import joblib
import os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report
from tokenizer_util import custom_tokenizer


df = pd.read_csv("train/job_skills_batch_1.csv")

# Assuming your columns are named 'job' and 'skills'
df = df.dropna(subset=["job", "skills"])  # Remove rows with missing job or skills

# Lowercase and clean up skills column
df["skills_cleaned"] = df["skills"].str.lower().str.replace(r"[^\w\s,]", "", regex=True)

# Initialize CountVectorizer to convert skills text into feature vectors
vectorizer = CountVectorizer(tokenizer=custom_tokenizer)
X = vectorizer.fit_transform(df["skills_cleaned"])

# Target variable
y = df["job"]

# Split data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Naive Bayes classifier
model = MultinomialNB()
model.fit(X_train, y_train)

# Evaluate on test set
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

os.makedirs("model", exist_ok=True)
joblib.dump(vectorizer, 'model/job_role_vectorizer.pkl')
joblib.dump(model, 'model/job_role_model.pkl')


# def predict_role(input_skills):
#     cleaned = input_skills.lower().replace(";", ",").replace("|", ",")
#     input_vec = vectorizer.transform([cleaned])
#     prediction = model.predict(input_vec)
#     return prediction[0]

# # Example test
# sample = "react, node, mongodb, docker"
# print("Predicted Job Role:", predict_role(sample))