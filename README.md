# BuyerForeSight User Management System

A premium, industry-grade REST API and React UI built for managing users. Features sleek dark/light aesthetics, SQLite ID reset handling, and debounced search.

## Setup Instructions

Ensure you have Node.js installed. In this directory, run:
```bash
npm install
```

## Running the Project

Because the frontend (React/Vite) and backend (Express/SQLite) run concurrently, you need to start them in two separate terminal windows.

### 1. Start the Backend API (Terminal 1)
Run the Node.js Express server which handles the SQLite database and REST API:
```bash
node server.js
```
*The backend server will run on `http://localhost:3001`.*

### 2. Start the React Frontend UI (Terminal 2)
In a new terminal window at the same project directory, run the Vite development server:
```bash
npm run dev
```
*Vite will start the frontend. Look at the terminal output for the local URL (usually `http://localhost:5173` or `5174`). Open this link in your browser to view the amazing UI!*

## Features
- **Modern UI**: Toggle between Light and Dark mode seamlessly.
- **REST API**: Standard CRUD operations using SQLite.
- **SQLite ID Sequence Reset**: Permanently deleting all records safely restarts the ID count at 1, keeping your database clean.
## Deploying to Production (Git)

To make both the Backend and Frontend work together seamlessly in production on a single server:

1. **Build the React Frontend**
   Before committing or deploying, run the Vite build command:
   ```bash
   npm run build
   ```
   *This complies your React app into the `dist` folder.*

2. **Commit to Git**
   ```bash
   git add .
   git commit -m "Initial commit for BuyerForeSight User Management"
   git push origin main
   ```

3. **Production Server Setup**
   When deploying to platforms like **Render**, **Railway**, or a standard VPS:
   - Your start command should just be: `npm start` (or `node server.js`)
   - The Express server is uniquely configured to automatically serve the `dist` folder.
   - You **do not** need to run two servers in production! Node.js handles the UI delivery and the API simultaneously.

*Note: Since SQLite writes to a local `.sqlite` file, ensure your deployment platform supports persistent disk storage (e.g., Render Disk or Railway Volume).*
"# buyerforesight-app" 
