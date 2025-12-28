# 🍽️ Meals Wrapped

**Meals Wrapped** is a Spotify-Wrapped-style food journaling app that turns your daily meals into beautiful, interactive insights — powered by a modern React frontend and a lightweight Python + ML backend.

Log what you eat, see patterns over time, and get **automatic cuisine suggestions** using a trained machine-learning model.

---

## ✨ Features

- 📝 **Meal Logging**  
  Track meals by date, type (breakfast/lunch/dinner/snack), category (home/restaurant/takeout), rating, cost, and notes.

- 🤖 **ML-Powered Cuisine Auto-Tagging**  
  Enter a food name → backend predicts the cuisine using a scikit-learn model.

- 📊 **Food Wrapped Analytics**  
  - Total meals
  - Top cuisines & foods
  - Meal type distribution
  - Home vs restaurant vs takeout split
  - Monthly trends
  - Fun achievement badges

- 🎨 **Modern UI**  
  - Built with React + TypeScript  
  - Smooth animations with Framer Motion  
  - Responsive, dark-mode friendly design

- 🔁 **Demo Mode**  
  No database required — includes seeded demo data so anyone can try it instantly.

---

## 🧠 Tech Stack

### Frontend
- **React + TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Recharts**

### Backend
- **FastAPI**
- **Python**
- **Pandas & NumPy**
- **scikit-learn**
- **Joblib** (model persistence)

---

## ⚙️ How It Works

1. Users log meals in the frontend
2. Meal data is sent to a FastAPI backend
3. A trained ML model predicts cuisine from the food name
4. Aggregated analytics are computed using Pandas
5. Results are visualized in a Spotify-Wrapped-style dashboard

---

## 🚀 Getting Started (Local)

### Clone the repo
```bash
git clone https://github.com/noah-dsouza/meals-wrapped.git
cd meals-wrapped

### Frontend Setup
npm install
npm run dev

### Backend Setup
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

### Env Variables
VITE_ENABLE_BACKEND=true
VITE_API_BASE_URL=http://127.0.0.1:8000


