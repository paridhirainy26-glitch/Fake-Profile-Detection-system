
import os
from datetime import datetime

import joblib
import pandas as pd
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import timedelta, timezone

load_dotenv()

app = Flask(__name__)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing from backend/.env"
    )

CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(BASE_DIR, "models"))
MODEL_PATH = os.path.join(MODEL_DIR, "fake_profile_models.joblib")

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

BINARY_FEATURES = [
    "profile pic",
    "name==username",
    "external URL",
    "private"
]

COUNT_FEATURES = [
    "fullname words",
    "description length",
    "#posts",
    "#followers",
    "#follows"
]

RATIO_FEATURES = [
    "nums/length username",
    "nums/length fullname"
]


def db_config():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "fake_profile_db"),
    }


def get_connection():
    return mysql.connector.connect(**db_config())


def load_bundle():
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(
            f"Model not found: {MODEL_PATH}. "
            "Run train_model.py first."
        )

    bundle = joblib.load(MODEL_PATH)

    if bundle.get("features") != FEATURES:
        raise RuntimeError(
            "Model features do not match app.py. "
            "Check train_model.py and retrain the model."
        )

    return bundle


def validate_profile(payload):
    missing = [field for field in FEATURES if field not in payload]

    if missing:
        raise ValueError(
            "Missing required fields: " + ", ".join(missing)
        )

    row = {}

    for field in FEATURES:
        try:
            value = float(payload[field])
        except (TypeError, ValueError):
            raise ValueError(f"{field} must be numeric.")

        if not pd.notna(value):
            raise ValueError(f"{field} must be a finite number.")

        if value < 0:
            raise ValueError(f"{field} cannot be negative.")

        row[field] = value

    for field in BINARY_FEATURES:
        if row[field] not in (0, 1):
            raise ValueError(f"{field} must be 0 or 1.")

    for field in COUNT_FEATURES:
        if not row[field].is_integer():
            raise ValueError(f"{field} must be a whole number.")
        row[field] = int(row[field])

    for field in RATIO_FEATURES:
        if row[field] > 1:
            raise ValueError(f"{field} must be between 0 and 1.")

    return row


def save_prediction(
    profile,
    model_name,
    prediction,
    probability,
    username,
    full_name
):
    conn = get_connection()
    cur = None

    try:
        cur = conn.cursor()

        sql = """
            INSERT INTO profile_predictions
            (
                username,
                full_name,
                profile_pic,
                username_number_ratio,
                fullname_words,
                fullname_number_ratio,
                name_matches_username,
                description_length,
                has_external_url,
                is_private,
                posts,
                followers,
                following,
                model_name,
                predicted_label,
                fake_probability,
                demo_pseudo_labels
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, 0
            )
        """

        values = (
            username,
            full_name,
            int(profile["profile pic"]),
            profile["nums/length username"],
            profile["fullname words"],
            profile["nums/length fullname"],
            int(profile["name==username"]),
            profile["description length"],
            int(profile["external URL"]),
            int(profile["private"]),
            profile["#posts"],
            profile["#followers"],
            profile["#follows"],
            model_name,
            "Fake" if prediction == 1 else "Likely Genuine",
            probability
        )

        cur.execute(sql, values)
        conn.commit()

        return cur.lastrowid

    finally:
        if cur:
            cur.close()

        if conn.is_connected():
            conn.close()

@app.post("/api/register")
def register():
    payload = request.get_json(silent=True) or {}

    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")

    if not name or not email or not isinstance(password, str):
        return jsonify({
            "error": "Name, email, and password are required."
        }), 400

    if len(name) > 100 or len(email) > 255:
        return jsonify({
            "error": "Name or email is too long."
        }), 400

    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"error": "Enter a valid email address."}), 400

    if len(password) < 10 or len(password) > 128:
        return jsonify({
            "error": "Password must be 10–128 characters long."
        }), 400

    password_hash = generate_password_hash(password)

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
        """, (name, email, password_hash))

        conn.commit()

        return jsonify({
            "message": "Account created successfully. You can now log in."
        }), 201

    except Error as exc:
        if conn and conn.is_connected():
            conn.rollback()

        if getattr(exc, "errno", None) == 1062:
            return jsonify({
                "error": "An account with this email already exists."
            }), 409

        app.logger.exception("Registration failed")
        return jsonify({
            "error": "Could not create account. Check the database connection."
        }), 500

    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}

    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password", "")

    if not email or not isinstance(password, str) or not password:
        return jsonify({
            "error": "Email and password are required."
        }), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = %s
            LIMIT 1
        """, (email,))

        user = cur.fetchone()

        
        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "error": "Invalid email or password."
            }), 401

        now = datetime.now(timezone.utc)

        token = jwt.encode(
            {
                "sub": str(user["id"]),
                "email": user["email"],
                "role": user["role"],
                "iat": now,
                "exp": now + timedelta(hours=8)
            },
            JWT_SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200


    except Error:
        app.logger.exception("Login database operation failed")
        return jsonify({
            "error": "Login failed due to a database error."
        }), 500

    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

@app.get("/api/health")
def health():
    try:
        bundle = load_bundle()

        return jsonify({
            "status": "ok",
            "models": list(bundle["models"].keys()),
            "label_source": bundle.get("label_source"),
            "warning": bundle.get("warning")
        })

    except Exception as exc:
        return jsonify({
            "status": "error",
            "message": str(exc)
        }), 500


@app.post("/api/predict")
def predict():
    try:
        payload = request.get_json(silent=True)

        if not isinstance(payload, dict):
            return jsonify({
                "error": "Send a JSON object in the request body."
            }), 400

        profile = validate_profile(payload)
        bundle = load_bundle()

        model_name = str(
            payload.get("model", "random_forest")
        ).lower()

        if model_name not in bundle["models"]:
            return jsonify({
                "error": "Unknown model.",
                "available_models": list(bundle["models"].keys())
            }), 400

        frame = pd.DataFrame([profile], columns=FEATURES)
        model = bundle["models"][model_name]

        prediction = int(model.predict(frame)[0])

        probability = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(frame)[0]
            classes = list(model.classes_)

            if 1 in classes:
                probability = float(
                    probabilities[classes.index(1)]
                )

        username = str(payload.get("username", "")).strip()
        full_name = str(payload.get("full_name", "")).strip()
        
        prediction_id = save_prediction(
            profile,
            model_name,
            prediction,
            probability,
            username,
            full_name
        )

        return jsonify({
            "prediction_id": prediction_id,
            "model": model_name,
            "predicted_label": (
                "Fake" if prediction == 1 else "Likely Genuine"
            ),
            "predicted_class": prediction,
            "fake_probability": probability,
            "label_source": bundle.get("label_source"),
            "warning": bundle.get("warning"),
            "note": (
                "This is a model estimate, not proof that "
                "an account is fake."
            )
        })

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    except Error as exc:
        app.logger.exception("Database operation failed")
        return jsonify({
            "error": "Database operation failed. "
                     "Check schema.sql and MySQL configuration.",
            "details": str(exc)
        }), 500

    except Exception as exc:
        app.logger.exception("Prediction failed")
        return jsonify({"error": str(exc)}), 500


@app.get("/api/profiles")
def profiles():
    conn = None
    cur = None

    try:
        limit = min(
            max(int(request.args.get("limit", 50)), 1), 200
        )

        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
          SELECT
            id,
            username,
            full_name,
            profile_pic,
            followers,
            following,
            posts,
            model_name,
            predicted_label,
            fake_probability,
            demo_pseudo_labels,
            status,
            created_at
          FROM profile_predictions
          ORDER BY id DESC
          LIMIT %s
        """, (limit,))

        rows = cur.fetchall()

        for row in rows:
            if row.get("created_at"):
                row["created_at"] = row["created_at"].isoformat()

        return jsonify({
            "count": len(rows),
            "profiles": rows
        })

    except (Error, ValueError) as exc:
        return jsonify({"error": str(exc)}), 500

    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

@app.put("/api/profiles/<int:prediction_id>/status")
def update_profile_status(prediction_id):
    payload = request.get_json(silent=True) or {}

    status = str(payload.get("status", "")).strip().title()

    allowed_statuses = ["Open", "Escalated", "Dismissed"]

    if status not in allowed_statuses:
        return jsonify({
            "error": "Invalid status.",
            "allowed_statuses": allowed_statuses
        }), 400

    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE profile_predictions
            SET status = %s
            WHERE id = %s
        """, (status, prediction_id))

        if cur.rowcount == 0:
            cur.execute("""
                SELECT id
                FROM profile_predictions
                WHERE id = %s
            """, (prediction_id,))

            if not cur.fetchone():
                return jsonify({
                    "error": "Profile not found."
                }), 404

        conn.commit()

        return jsonify({
            "message": "Profile status updated successfully.",
            "prediction_id": prediction_id,
            "status": status
        }), 200

    except Error as exc:
        if conn and conn.is_connected():
            conn.rollback()

        app.logger.exception("Status update failed")

        return jsonify({
            "error": "Could not update profile status.",
            "details": str(exc)
        }), 500

    finally:
        if cur:
            cur.close()

        if conn and conn.is_connected():
            conn.close()

@app.post("/api/report")
def report_profile():
    payload = request.get_json(silent=True) or {}

    prediction_id = payload.get("prediction_id")
    reason = str(payload.get("reason", "")).strip()
    details = str(payload.get("details", "")).strip()

    if not prediction_id or not reason:
        return jsonify({
            "error": "prediction_id and reason are required."
        }), 400

    try:
        prediction_id = int(prediction_id)

        if prediction_id <= 0:
            raise ValueError("prediction_id must be positive.")

        conn = get_connection()

        try:
            cur = conn.cursor()

            cur.execute("""
                INSERT INTO profile_reports
                    (prediction_id, reason, details, status)
                VALUES (%s, %s, %s, 'pending')
            """, (
                prediction_id,
                reason[:120],
                details[:2000]
            ))

            conn.commit()
            report_id = cur.lastrowid
            cur.close()

        finally:
            conn.close()

        return jsonify({
            "report_id": report_id,
            "status": "pending",
            "message": (
                "Report stored for review. "
                "It has not been submitted to a social platform."
            )
        }), 201

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    except Error as exc:
        return jsonify({
            "error": "Could not save report.",
            "details": str(exc)
        }), 500


@app.get("/api/reports")
def get_reports():
    conn = None
    cur = None

    try:
        limit = min(
            max(int(request.args.get("limit", 50)), 1), 200
        )

        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT
                id,
                prediction_id,
                reason,
                details,
                status,
                created_at
            FROM profile_reports
            ORDER BY id DESC
            LIMIT %s
        """, (limit,))

        rows = cur.fetchall()

        for row in rows:
            if row.get("created_at"):
                row["created_at"] = row["created_at"].isoformat()

        return jsonify({
            "count": len(rows),
            "reports": rows
        })

    except (Error, ValueError) as exc:
        app.logger.exception("Could not retrieve reports")
        return jsonify({
            "error": "Could not retrieve reports.",
            "details": str(exc)
        }), 500

    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=False
    )
