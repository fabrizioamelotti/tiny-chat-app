# Tiny Chat App Frontend (Next.js)

## Getting Started | Dev

### Step 1
NPM Install
```bash
    npm install
```

### Step 2
Creat the `.env` file.
Use the `.env.dev` as an example

### Step 3
Run the development server:

```bash
  npm run dev
```

### Step 4
Open [http://localhost:3005](http://localhost:3005)

## Build for PROD

### Step 1
```bash
    npm run build
```

### Step 2
```bash
    npm run start
```

Open [http://localhost:3005](http://localhost:3005)

## Features

### SDK
This project uses the backend SDK to execute the API calls to the backend.
Take a look the `BackendApiProvider` for options and more information and
also check the `openapitools.json` for the SDK generation.

## Environment Variables

### NEXT_PUBLIC_BACKEND_PATH
Set the Path for the backend connection

Example on local environment:
```bash
NEXT_PUBLIC_BACKEND_PATH=http://localhost:3000
```

