# FakeProfile Shield
### Fake Social Media Profile Detection and Reporting System

**Team G-9 | B.Tech CSE (Data Science) | SVVV Indore**

FakeProfile Shield is a web-based system that detects potentially fake social media profiles using Machine Learning and provides profile management and reporting functionality.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python Flask
- **Database:** MySQL
- **Machine Learning:** Random Forest and Gradient Boosting
- **Authentication:** JWT

## Features

- User login and authentication
- Social media profile analysis
- Fake profile prediction using ML models
- Random Forest and Gradient Boosting model selection
- Flagged profile management
- Profile status management (Open, Escalated, Dismissed)
- Report generation and management
- Dashboard and model insights

## Machine Learning

The system uses two trained classification models:

1. Random Forest
2. Gradient Boosting

The models are trained using profile-related features such as username characteristics, profile picture availability, followers, following, posts, bio description, privacy settings, and external URL.

### Model Performance

| Model | Accuracy |
|---|---:|
| Random Forest | 91.67% |
| Gradient Boosting | 90.00% |

These results are based on the project's test dataset.

## Project Structure

```text
Fake-Profile-Detection-system/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── schema.sql
│   ├── train_model.py
│   ├── test_db.py
│   ├── data/
│   └── models/
│
├── css/
├── js/
│   ├── api.js
│   ├── actions.js
│   ├── components.js
│   ├── pages.js
│   └── router.js
│
├── index.html
├── package.json
└── package-lock.json
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/paridhirainy26-glitch/Fake-Profile-Detection-system.git
cd Fake-Profile-Detection-system
```

### 2. Frontend setup

```bash
npm install
npm start
```

Open `http://localhost:5173` in your browser.

### 3. Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your local `.env` file with the required database and JWT settings.

### 4. Database setup

- Create the MySQL database.
- Execute the SQL commands from `schema.sql`.
- Configure database credentials in the backend `.env` file.

### 5. Start the backend

```bash
python app.py
```

## Team

**Team G-9**  
B.Tech CSE (Data Science)  
Shri Vaishnav Vidyapeeth Vishwavidyalaya, Indore

**Project Guide:** Prof. Kamal Borana

---

*FakeProfile Shield – Detecting and reporting potentially fake social media profiles.*
