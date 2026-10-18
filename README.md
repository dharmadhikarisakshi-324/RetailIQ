# RetailIQ — AI-Powered Retail Intelligence System

An end-to-end AI/ML application designed to transform retail transaction data into actionable insights for customer intelligence, product recommendations, promotion planning, sales analytics, and inventory management.

**Project Status:** Core development completed; deployment and final refinements in progress.

## Overview

RetailIQ combines machine learning, data analytics, and web application development to help retailers understand customer behaviour, identify business opportunities, and make data-driven operational decisions.

The system processes historical retail transactions and applies machine learning techniques to generate customer segments, estimate customer lifetime value, identify churn risk, recommend products, support promotion planning, and forecast inventory demand.

## Key Features

- **Customer Intelligence:** RFM analysis, customer segmentation, customer lifetime value (CLV) estimation, and churn-risk prediction.
- **Product Intelligence:** Product-level insights, purchasing patterns, and product performance analysis.
- **Recommendation System:** Combines collaborative filtering and content-based recommendations to suggest relevant products.
- **Promotion Intelligence:** ML-supported purchase prediction and promotion-related insights.
- **Inventory Intelligence:** Demand forecasting, safety-stock calculation, reorder-point estimation, stockout-risk assessment, and suggested reorder quantities.
- **Sales Analytics:** Revenue analysis, sales trends, and product performance summaries.
- **Web Application:** React and TypeScript frontend integrated with a FastAPI backend, with database-backed APIs and role-oriented application functionality.

## Technology Stack

| Area              | Technologies                                                |
| ----------------- | ----------------------------------------------------------- |
| Programming       | Python, TypeScript, SQL                                     |
| Data Processing   | Pandas, NumPy                                               |
| Machine Learning  | Scikit-learn, XGBoost                                       |
| Explainable AI    | SHAP                                                        |
| Backend           | FastAPI                                                     |
| Frontend          | React, Vite, TypeScript                                     |
| Database          | PostgreSQL / MySQL, depending on the configured environment |
| Model Persistence | Pickle-based `.pkl` artifacts                               |
| Development Tools | Git, GitHub, Jupyter Notebook                               |

## Machine Learning Modules

### 1. Customer Intelligence

- RFM (Recency, Frequency, Monetary) feature engineering.
- K-Means-based customer segmentation.
- XGBoost-based customer lifetime value estimation.
- Random Forest-based churn-risk prediction.
- Model evaluation using metrics such as R², accuracy, recall, and ROC-AUC, where applicable.

### 2. Product Intelligence

- Product-level transaction analysis.
- Product performance summaries.
- Insights derived from historical purchasing behaviour.

### 3. Recommendation System

- Collaborative filtering using customer–product interactions.
- Content-based recommendations using product representations and similarity.
- Hybrid recommendation logic combining collaborative and content-based signals.
- Popular-product fallback recommendations where appropriate.

### 4. Promotion Intelligence

- Machine-learning-supported purchase prediction.
- Promotion-related insights based on historical transaction patterns.

### 5. Inventory Intelligence

- Daily demand forecasting using historical demand features.
- Lag-based and rolling-window feature engineering.
- Safety-stock and reorder-point calculations.
- Stockout-risk assessment and suggested reorder quantities.

## Dataset

The project uses the **Online Retail II** transaction dataset.

The data preparation workflow includes cleaning, preprocessing, feature engineering, and creation of model-specific datasets for customer, product, recommendation, promotion, and inventory analysis.

Reported dataset-processing results from the development workflow:

- Original dataset: approximately 525,461 records.
- Cleaned dataset: approximately 407,664 records.
- Customer RFM dataset: 4,312 customers.
- Product summary dataset: 4,446 products.
- Inventory recommendations dataset: 4,017 records.

*These figures describe intermediate project artifacts and may vary depending on the preprocessing and filtering steps used by individual modules.*

## System Architecture

```text
Historical Retail Transactions
            |
            v
 Data Cleaning and Preprocessing
            |
            v
 Feature Engineering and Analysis
            |
            v
      ML Intelligence Layer
   /         |          \
Customer   Product    Inventory
Insights   Insights    Forecasts
   \         |          /
            v
 Recommendation and Promotion
        Intelligence
            |
            v
       FastAPI Backend
            |
            v
 Database and REST APIs
            |
            v
 React + TypeScript Frontend
            |
            v
 Retail Analytics Experience
```

## Project Structure

```text
RetailIQ/
├── backend/
│   └── app/
│       ├── api/
│       ├── models/
│       ├── repositories/
│       ├── schemas/
│       └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── data/
├── models/
├── docs/
├── requirements.txt
└── README.md
```

*The structure above is representative; refer to the repository for the current directory layout.*

## Local Development

### Prerequisites

- Python 3.10 or a compatible version supported by the backend dependencies.
- Node.js and npm.
- A configured database.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/dharmadhikarisakshi-324/RetailIQ.git
cd RetailIQ
```

### 2. Set up the backend

Create and activate a virtual environment, then install the dependencies:

```bash
python -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configure the required environment variables and database connection using the project's environment configuration. Do not commit real credentials or secret keys.

Start the backend using the entry point configured in the repository. For the current FastAPI setup, the command may resemble:

```bash
uvicorn backend.app.main:app --reload --port 8002
```

If the backend starts successfully, its API documentation should be available at:

`http://127.0.0.1:8002/docs`

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173/`

Ensure that the frontend API configuration points to the running backend and that authentication and database configuration are correct.

## Model Evaluation

The following are reported development-stage results for selected models:

| Model                             | Evaluation Metric | Reported Result |
| --------------------------------- | ----------------- | --------------: |
| Customer lifetime value — XGBoost | R²                |          0.4377 |
| Customer churn — Random Forest    | Accuracy          |          0.6435 |
| Customer churn — Random Forest    | Recall            |          0.8223 |
| Customer churn — Random Forest    | ROC-AUC           |          0.7161 |

These are experimental results from the current development workflow, not guarantees of production performance. Model quality should be assessed alongside class balance, validation methodology, business costs, and performance on unseen data.

## Current Development Status

- [x] Retail transaction preprocessing and data preparation
- [x] Customer segmentation and customer intelligence models
- [x] Product analysis and recommendation logic
- [x] Promotion intelligence module
- [x] Inventory demand forecasting and reorder recommendations
- [x] FastAPI backend and database integration work
- [x] React and TypeScript frontend implementation
- [x] Final integration and end-to-end testing
- [ ] Deployment configuration and production deployment
- [ ] Final bug fixes, documentation updates, and refinements

## Future Improvements

- Deploy the application using a suitable cloud platform.
- Improve model evaluation and monitor performance after deployment.
- Add automated model retraining and data refresh workflows.
- Strengthen authentication, authorization, logging, and error handling.
- Improve API performance and frontend responsiveness.
- Add monitoring for demand forecasts, churn predictions, and recommendation quality.

## Purpose

RetailIQ demonstrates the practical application of machine learning in retail operations by connecting data processing, predictive modelling, REST APIs, database integration, and frontend development in a single project.

The goal is to make retail analytics more accessible and support better-informed decisions across customer engagement, product discovery, promotions, and inventory planning.

## Author

**Sakshi Dharmadhikari**

B.Tech — Computer Science Engineering (Artificial Intelligence & Machine Learning)

GitHub: [dharmadhikarisakshi-324](https://github.com/dharmadhikarisakshi-324)

---

*RetailIQ is an academic and portfolio project. Predictions and recommendations should be validated against real operational data before being used for business decisions.*

