# MIND Think

MIND Think is a full-stack web application for student wellness and academic evaluation workflows. It combines a React frontend with a Django REST backend to support user login, university registration, student/profile management, document upload, Excel-based report imports, PDF answer evaluation, QR generation, appointment/contact pages, and mental-health oriented informational modules.

The repository is split into two main applications:

- `norm-a1/` - React frontend created with Create React App.
- `backend/` - Django + Django REST Framework backend.

## Project Overview

The application is designed as a dashboard-style platform where authenticated users can:

- Register and log in.
- Register universities/institutions.
- Create student/profile records linked to universities.
- View and delete registered students.
- Upload images and PDFs.
- View previously uploaded files.
- Upload Excel sheets containing student marks.
- Store report/marks data in the backend.
- Evaluate PDF answer sheets in normal mode or against a reference PDF.
- Use dashboard pages for overview, announcements, evidence, appointments, contact/location, QR generation, neurofeedback, stress monitoring, and about information.

## Tech Stack

### Frontend

- React `19`
- React Router DOM `7`
- Axios
- Bootstrap / React Bootstrap
- Formik and Yup for forms and validation
- React Toastify for notifications
- Recharts for charts/graphs
- `xlsx` for Excel upload/template handling
- QR libraries:
  - `qrcode.react`
  - `react-qr-code`
- React Icons

### Backend

- Python
- Django `6`
- Django REST Framework
- PostgreSQL
- django-cors-headers
- PDF text extraction with `pdfplumber`
- Experimental answer evaluation modules using:
  - Groq API / Llama model integration
  - NLTK BLEU scoring
  - Optional BERTScore semantic scoring
  - Optional PaddleOCR + pdf2image + Ollama flow for scanned/handwritten PDFs

## Repository Structure

```text
.
+-- README.md
+-- .gitignore
+-- backend/
|   +-- manage.py
|   +-- requirements.txt
|   +-- backend1/
|   |   +-- settings.py
|   |   +-- urls.py
|   |   +-- asgi.py
|   |   +-- wsgi.py
|   +-- p1/
|   |   +-- models.py
|   |   +-- views.py
|   |   +-- serializers.py
|   |   +-- urls.py
|   |   +-- reference_evaluation.py
|   |   +-- Reference_evaluation1.py
|   |   +-- admin.py
|   |   +-- apps.py
|   |   +-- tests.py
|   |   +-- migrations/
|   +-- reports/
|       +-- uploaded report/media files
+-- norm-a1/
    +-- package.json
    +-- package-lock.json
    +-- public/
    +-- src/
        +-- App.js
        +-- index.js
        +-- landing.js
        +-- login.js
        +-- signin.js
        +-- home.js
        +-- overview.js
        +-- announcement.js
        +-- registerdb.js
        +-- pdetails.js
        +-- unireg.js
        +-- report.js
        +-- fileview.js
        +-- herosec.js
        +-- nfeedback.js
        +-- stressm.js
        +-- evidence.js
        +-- appointment.js
        +-- call.js
        +-- place.js
        +-- qr.js
        +-- CSS/assets
```

## Main Frontend Pages

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `landing.js` | Public landing page |
| `/login` | `login.js` | User login |
| `/signin` | `signin.js` | User signup |
| `/home` | `home.js` | Main authenticated home page |
| `/overview` | `overview.js` | Overview/dashboard page |
| `/announcement` | `announcement.js` | Announcements page |
| `/registerdb` | `registerdb.js` | Registered student list and delete action |
| `/pdetails` | `pdetails.js` | Student/profile creation form |
| `/unireg` | `unireg.js` | University registration form |
| `/report` | `report.js` | Image/PDF upload and Excel bulk marks upload |
| `/fileview` | `fileview.js` | Uploaded file listing and preview |
| `/hero` | `herosec.js` | PDF evaluation system |
| `/nfeedback` | `nfeedback.js` | Neurofeedback page |
| `/stressm` | `stressm.js` | Stress monitoring page |
| `/evidence` | `evidence.js` | Evidence page |
| `/appointment` | `appointment.js` | Appointment page |
| `/call` | `call.js` | Contact page |
| `/place` | `place.js` | Location/place page |
| `/qr` | `qr.js` | QR code generation page |
| `/aboutus` | `aboutus.js` | About page |

Authentication state is currently stored in `localStorage` with the key `isLoggedIn`.

## Backend Models

### `User`

Stores basic application login data:

- `name`
- `email`
- `password`

### `University`

Stores institution details:

- university name/type
- establishment date
- address
- website
- head/principal details
- college code
- affiliation/accreditation details
- required documents
- state/country
- email/contact
- about text

### `Profile`

Stores student/profile details linked to a university:

- first name and last name
- date of birth
- gender
- USN
- designation
- university foreign key
- university code
- location
- email/password
- phone
- state/country

### `ReportFile`

Stores uploaded report files:

- uploaded file path
- upload timestamp

### `Report`

Stores marks/report records:

- USN
- subject name
- written date
- marks from 0 to 100
- created timestamp

The model uses a unique constraint on `usn` and `subject_name`.

### `PDFData`

Stores extracted PDF data as JSON.

## Backend API Endpoints

All backend endpoints are mounted under `/api/`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/signup/` | Create a basic user account |
| `POST` | `/api/login/` | Login with email and password |
| `GET` | `/api/get-csrf/` | Set CSRF cookie |
| `GET` | `/api/universities/` | List universities for dropdowns |
| `POST` | `/api/create-university/` | Create a university record |
| `POST` | `/api/create-profile/` | Create a student/profile record |
| `GET` | `/api/students/` | List registered students |
| `DELETE` | `/api/students/<id>/` | Delete a student/profile |
| `POST` | `/api/upload-files/` | Upload one or more files |
| `GET` | `/api/get-files/` | List uploaded files |
| `POST` | `/api/bulk/` | Bulk import marks/report data from frontend Excel JSON |
| `POST` | `/api/read-pdf/` | Extract page text from uploaded PDF |
| `POST` | `/api/upload-pdf/` | Evaluate answers from a single PDF |
| `GET` | `/api/get-pdf/<id>/` | Get stored extracted PDF data |
| `POST` | `/api/reference-evaluation/` | Evaluate a student PDF against a reference PDF |
| `POST` | `/api/reference-evaluation1/` | Experimental OCR/Ollama-based reference PDF evaluation |

## PDF Evaluation Workflows

### Normal PDF Evaluation

Frontend page: `/hero`

Endpoint:

```text
POST /api/upload-pdf/
```

Expected upload field:

- `file` - student PDF

The backend extracts questions and answers from the PDF text, scores answers using the configured LLM flow, and returns:

```json
{
  "total_questions": 5,
  "total_score": 38,
  "max_score": 50,
  "percentage": 76.0,
  "results": [
    {
      "question_number": 1,
      "marks_obtained": 8,
      "marks_out_of": 10
    }
  ]
}
```

### Reference PDF Evaluation

Frontend page: `/hero`

Endpoint:

```text
POST /api/reference-evaluation/
```

Expected upload fields:

- `file` - student PDF
- `reference_pdf` - teacher/reference answer PDF

The backend matches question numbers from both PDFs and scores student answers against the reference answers.

There is also an experimental endpoint:

```text
POST /api/reference-evaluation1/
```

This version is intended for OCR-based/scanned PDF evaluation using Poppler, PaddleOCR, and a local Ollama model.

## Excel Bulk Upload Format

The `/report` page supports Excel upload for marks data. The expected columns are:

```text
USN
Subject Name
Written Date
Marks Obtained
```

Validation rules:

- `USN` is required.
- `Subject Name` is required.
- `Marks Obtained` must be between `0` and `100`.
- Duplicate `(USN, Subject Name)` records are rejected.
- `Written Date` supports common formats such as:
  - `YYYY-MM-DD`
  - `DD-MM-YYYY`
  - `DD/MM/YYYY`
  - Excel numeric date values

## Local Setup

### Prerequisites

- Node.js and npm
- Python 3
- PostgreSQL
- Git

Optional for advanced PDF evaluation:

- Poppler
- Ollama
- PaddleOCR
- BERTScore dependencies
- NLTK data/packages

## Backend Setup

From the repository root:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend runs by default at:

```text
http://localhost:8000
```

### Database Configuration

The current Django settings use PostgreSQL:

```text
DATABASE_NAME = ieng
DATABASE_USER = kencloud
DATABASE_PASSWORD = kencloud123
DATABASE_HOST = localhost
DATABASE_PORT = 5432
```

Create the database/user in PostgreSQL before running migrations, or update `backend/backend1/settings.py` with your local database credentials.

Example PostgreSQL setup:

```sql
CREATE DATABASE ieng;
CREATE USER kencloud WITH PASSWORD 'kencloud123';
GRANT ALL PRIVILEGES ON DATABASE ieng TO kencloud;
```

## Frontend Setup

Open a second terminal from the repository root:

```bash
cd norm-a1
npm install
npm start
```

The frontend runs by default at:

```text
http://localhost:3000
```

## Frontend Environment Variables

Some frontend files use:

```text
REACT_APP_API_URL
```

Create `norm-a1/.env`:

```env
REACT_APP_API_URL=http://localhost:8000
```

Several components currently call `http://localhost:8000` directly, so local development expects the backend to run on port `8000`.

## CORS Configuration

The Django backend currently allows:

```text
http://localhost:3000
http://192.168.10.4:3000
```

These values are configured in `backend/backend1/settings.py`.

## Running Tests

### Frontend

```bash
cd norm-a1
npm test
```

### Backend

```bash
cd backend
python manage.py test
```

The backend test file currently contains the default placeholder test class only.

## Build Frontend for Production

```bash
cd norm-a1
npm run build
```

The production build is generated in:

```text
norm-a1/build/
```

## Important Security Notes Before Publishing

Before making this repository public or deploying it:

- Move Django `SECRET_KEY` into an environment variable.
- Turn `DEBUG` off in production.
- Replace `ALLOWED_HOSTS = ["*"]` with real hostnames.
- Move database credentials into environment variables.
- Remove hard-coded API keys from source code.
- Rotate any API key that has already been committed.
- Hash user passwords instead of storing plain text passwords.
- Review CORS and CSRF settings for the production domain.
- Do not commit uploaded files from `backend/reports/` unless they are sample/demo files.
- Add production media/static-file handling.

## Notes and Current Limitations

- The project is currently configured for local development.
- Password handling is basic and should be upgraded before production use.
- Some frontend API calls use `REACT_APP_API_URL`, while others are hard-coded to `http://localhost:8000`.
- Advanced PDF evaluation dependencies are not all listed in `backend/requirements.txt`.
- The OCR/Ollama evaluation path requires extra system setup and a local Ollama model.
- The backend uses PostgreSQL even though `.gitignore` also includes SQLite ignore rules.

## Git Ignore Coverage

The repository ignores common local/generated files, including:

- SQLite database files
- Python bytecode/cache files
- virtual environments
- React `node_modules`
- React production build output
- VS Code settings
- `.env` files

## Suggested Future Improvements

- Add environment-based Django settings.
- Add proper authentication with hashed passwords and tokens/sessions.
- Normalize all frontend API URLs through one config file.
- Add serializers for all backend models.
- Add backend tests for signup, login, profile creation, file upload, and bulk report import.
- Add frontend tests for login, routing, student listing, upload, and PDF evaluation screens.
- Add API documentation with request/response examples for every endpoint.
- Add deployment documentation for PostgreSQL, static files, media files, and environment variables.

## License

No license file is currently included. Add a license before publishing if this project is intended to be open source.
