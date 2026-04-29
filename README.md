# ♟️ Chess Heaven

Chess Heaven is a modern, minimal, and distraction-free online chess platform designed for private matches. It offers a "zen-like" environment for competitive play without the bloat of traditional chess sites.

---

## 🛠️ Step 1: Local Development (Running on your computer)

Follow these steps to get the project running on your own machine for testing or development.

### 1. Prerequisites
- **Node.js**: [Download and install Node.js](https://nodejs.org/) (Version 20 or higher).
- **Code Editor**: [VS Code](https://code.visualstudio.com/) is recommended.
- **Git**: [Install Git](https://git-scm.com/) to download the code.

### 2. Setup Instructions
1.  **Download the Code**:
    Open your terminal/command prompt and run:
    ```bash
    git clone https://github.com/yourusername/chess-heaven.git
    cd chess-heaven
    ```
2.  **Install Packages**:
    Run this command to install all necessary tools:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    - Create a new file in the root folder named `.env`
    - Copy the contents from `.env.example` into your new `.env` file.
    - For local use, ensure `APP_MODE=local` is set.
4.  **Get your Credentials**:
    - **Clerk**: Sign up at [Clerk.com](https://clerk.com/), create a new application, and copy your **Publishable Key** and **Secret Key**.
    - **MongoDB**: You can install MongoDB locally or use a free cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
5.  **Run the App**:
    ```bash
    npm run dev
    ```
    Now, open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🌐 Step 2: Deployment Guide (Railway + Vercel)

Making your website "Live" so anyone in the world can play.

### Part A: Setting up the Database (Railway)
Railway will host your MongoDB database.

1.  **Sign Up**: Go to [Railway.app](https://railway.app/) and log in with your GitHub.
2.  **Create Database**:
    - Click **"New Project"**.
    - Search for and select **"Provision MongoDB"**.
3.  **Get the Connection URL**:
    - Once the MongoDB service is created, click on it.
    - Go to the **"Variables"** tab.
    - Copy the value of `MONGODB_URL` (it looks like `mongodb://...`). This is your `MONGODB_URI`.

### Part B: Setting up Authentication (Clerk)
1.  **Create Application**: In your Clerk Dashboard, create a "Production" instance if you are ready for a real domain.
2.  **Get Keys**: Copy the Production **Publishable Key** and **Secret Key**.

### Part C: Setting up the Website (Vercel)
Vercel will host your Chess Heaven website.

1.  **Push to GitHub**: Upload your code to a private or public repository on GitHub.
2.  **Import to Vercel**:
    - Go to [Vercel.com](https://vercel.com/) and click **"Add New"** > **"Project"**.
    - Import your `chess-heaven` repository.
3.  **Configure Environment Variables**:
    In the "Environment Variables" section during setup, add the following:
    - `APP_MODE`: Set to `deploy`
    - `MONGODB_URI`: (The URL you copied from Railway)
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: (From Clerk)
    - `CLERK_SECRET_KEY`: (From Clerk)
    - `NEXT_PUBLIC_DEPLOY_FRONTEND_URL`: `https://your-app-name.vercel.app` (You can find this name on the Vercel dashboard or change it later).
    - `NEXT_PUBLIC_DEPLOY_BACKEND_URL`: `https://your-app-name.vercel.app` (Usually the same as frontend for Next.js).
4.  **Deploy**: Click **"Deploy"**. Vercel will give you a live URL!

---

## ⚙️ How the `.env` Modes Work

We have made it easy to switch between your local computer and the live website using the `APP_MODE` setting in your `.env` file.

| Setting | Value | Description |
| :--- | :--- | :--- |
| **APP_MODE** | `local` | Uses `http://localhost:3000`. Perfect for testing on your own machine. |
| **APP_MODE** | `deploy` | Uses the `DEPLOY_FRONTEND_URL` and `DEPLOY_BACKEND_URL` you provide. |

### Why use two URLs?
- **Frontend URL**: This is where your users go to play (e.g., `chess-heaven.vercel.app`).
- **Backend URL**: In case you ever want to host your game logic on a different server (like Railway), you can put that URL here. For most users, this will be the same as your Frontend URL.

---

## 🚀 Pro Tip: Generating a Custom Domain in Railway
If you decide to host the entire app on Railway instead of Vercel:
1.  Connect your GitHub repo to Railway.
2.  Go to the **"Settings"** tab of your service.
3.  Under **"Networking"**, click **"Generate Domain"**.
4.  Railway will give you a URL like `chess-heaven-production.up.railway.app`. Use this URL in your `.env` settings!

## 📜 License
This project is licensed under the MIT License.
