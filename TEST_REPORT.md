# Test Report

## Backend (Pytest)
- **Command:** `cd backend && pytest`
- **Environment:** Windows, Python 3.11.0, Django 5.2.9, Pytest 9.0.2
- **Results:** 3 tests passed (sweets/tests/test_api.py) in 17.37 seconds

```
============================= test session starts =============================
platform win32 -- Python 3.11.0, pytest-9.0.2, pluggy-1.6.0
django: version: 5.2.9, settings: sweetshop_backend.settings (from ini)
rootdir: D:\sweetshop
plugins: anyio-4.11.0, langsmith-0.4.43, django-4.11.1
collected 3 items

sweets/tests/test_api.py ...                                             [100%]

============================= 3 passed in 17.37s ==============================
```

## Frontend (Vite Build)
- **Command:** `cd frontend && npm run build`
- **Results:** Build succeeded (Vite v7.2.7) in ~7.8 seconds. Warning about Node.js < 20.19.0 appears but does not prevent a successful build.

```
vite v7.2.7 building client environment for production...
✓ built in 7.79s
```
