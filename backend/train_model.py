
import os
import joblib
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "models")

TRAIN_PATH = os.path.join(DATA_DIR, "train.csv")
TEST_PATH = os.path.join(DATA_DIR, "test.csv")
MODEL_PATH = os.path.join(MODEL_DIR, "fake_profile_models.joblib")

TARGET = "fake"

FEATURES = [
    "profile pic",
    "nums/length username",
    "fullname words",
    "nums/length fullname",
    "name==username",
    "description length",
    "external URL",
    "private",
    "#posts",
    "#followers",
    "#follows"
]


def load_dataset(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")

    df = pd.read_csv(path)

    required = FEATURES + [TARGET]
    missing = [column for column in required if column not in df.columns]

    if missing:
        raise ValueError(
            f"{os.path.basename(path)} is missing columns: {missing}"
        )

    if df[required].isnull().any().any():
        print(f"Warning: Missing values found in {path}")

    for column in FEATURES + [TARGET]:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df = df.dropna(subset=[TARGET])

    if not df[TARGET].isin([0, 1]).all():
        raise ValueError("The fake column must contain only 0 and 1.")

    if df[TARGET].nunique() != 2:
        raise ValueError("Both genuine (0) and fake (1) labels are required.")

    X = df[FEATURES].copy()
    y = df[TARGET].astype(int)

    return X, y


def main():
    print("Loading training and testing datasets...")

    X_train, y_train = load_dataset(TRAIN_PATH)
    X_test, y_test = load_dataset(TEST_PATH)

    print(f"Training records: {len(X_train)}")
    print(f"Testing records: {len(X_test)}")
    print("\nTraining label counts:")
    print(y_train.value_counts().sort_index())
    print("\nTesting label counts:")
    print(y_test.value_counts().sort_index())

    estimators = {
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=3,
            random_state=42
        )
    }

    models = {}
    metrics = {}

    for name, estimator in estimators.items():
        model = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("classifier", estimator)
        ])

        model.fit(X_train, y_train)
        predictions = model.predict(X_test)

        metrics[name] = {
            "accuracy": round(
                float(accuracy_score(y_test, predictions)), 4
            ),
            "precision_fake": round(
                float(precision_score(
                    y_test, predictions, zero_division=0
                )), 4
            ),
            "recall_fake": round(
                float(recall_score(
                    y_test, predictions, zero_division=0
                )), 4
            ),
            "f1_fake": round(
                float(f1_score(
                    y_test, predictions, zero_division=0
                )), 4
            ),
            "classification_report": classification_report(
                y_test,
                predictions,
                zero_division=0,
                output_dict=True
            ),
            "confusion_matrix": confusion_matrix(
                y_test, predictions, labels=[0, 1]
            ).tolist()
        }

        models[name] = model

        print(f"\n===== {name.upper()} =====")
        print(f"Accuracy:  {metrics[name]['accuracy']:.2%}")
        print(f"Precision: {metrics[name]['precision_fake']:.2%}")
        print(f"Recall:    {metrics[name]['recall_fake']:.2%}")
        print(f"F1-score:  {metrics[name]['f1_fake']:.2%}")
        print("Confusion matrix (rows=true, columns=predicted):")
        print(metrics[name]["confusion_matrix"])

    os.makedirs(MODEL_DIR, exist_ok=True)

    bundle = {
        "models": models,
        "features": FEATURES,
        "label_source": "dataset_target_column:fake",
        "warning": (
            "Evaluation uses the supplied labeled test set. "
            "Results depend on its quality and representativeness."
        ),
        "metrics": metrics
    }

    joblib.dump(bundle, MODEL_PATH)

    print(f"\nModels saved to: {MODEL_PATH}")
    print("Training and evaluation completed.")


if __name__ == "__main__":
    main()
