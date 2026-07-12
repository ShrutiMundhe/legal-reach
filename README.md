# Legal-Reach

*A modern, full-stack application connecting legal professionals and clients with an integrated AI-powered assistant.*

---

## 📜 Project Overview

Legal-Reach is a comprehensive platform designed to bridge the gap between legal service providers and individuals seeking legal help. It features real-time video and audio communication, a secure backend for data management, and an intelligent RAG (Retrieval-Augmented Generation) chatbot to provide instant answers to legal queries based on a knowledge base.

This repository contains the complete source code for the frontend web application, the backend server, and the AI chatbot service.

## ✨ Features

-   **Real-Time Communication:** Engage in secure, peer-to-peer video and audio calls using WebRTC.
-   **AI-Powered RAG Bot:** An intelligent chatbot that provides accurate and context-aware answers from a dedicated legal knowledge base.
-   **Full-Stack Architecture:** A robust system with a clear separation of concerns between the frontend, backend, and AI services.
-   **Data Management:** Securely handles user data and application state with a MongoDB database.

## 🛠️ Tech Stack

The project is built with a modern, scalable technology stack:

| Component | Technology |
| :--- | :--- |
| **Frontend** | JavaScript/TypeScript, React (assumption), WebRTC (`simple-peer`, `webrtc-adapter`) |
| **Backend** | Node.js, Express.js (assumption), MongoDB Driver |
| **Database** | MongoDB |
| **AI Chatbot** | Python, Retrieval-Augmented Generation (RAG), LangChain/LlamaIndex (assumption) |

## 📂 Project Structure

The repository is organized into three main components. You may need to create the `backend` and `frontend` folders and move your code into them if you haven't already.

```
Legal-Reach-main/
├── backend/                  # Contains the Node.js backend server code
├── frontend/                 # Contains the React/JS frontend application code
└── LocalAIAgentWithRAG-main/ # Contains the Python RAG chatbot code
```

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed on your system:
-   Node.js (v18.x or later recommended)
-   Python (v3.9 or later recommended)
-   MongoDB (running instance, local or remote)
-   `git` for version control

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/KhuneKushal/Legal-Reach-main.git
    cd Legal-Reach-main
    ```

2.  **Setup the Backend:**
    -   Navigate to the backend directory:
        ```bash
        cd backend
        ```
    -   Install dependencies:
        ```bash
        npm install
        ```
    -   Create a `.env` file by copying the example. This file will store your database connection string and other secrets.
        ```bash
        # Create a file named .env and add the following
        ```
    -   Edit the `.env` file with your MongoDB URI and other required variables:
        ```
        MONGO_URI=mongodb://localhost:27017/legalreach
        PORT=5000
        # Add other backend-specific environment variables
        ```

3.  **Setup the Frontend:**
    -   Navigate to the frontend directory:
        ```bash
        cd ../frontend
        ```
    -   Install dependencies:
        ```bash
        npm install
        ```
    -   Create a `.env` file for frontend-specific environment variables, such as the backend API URL.
        ```bash
        # Create a file named .env and add the following
        ```
    -   Edit the `.env` file:
        ```
        REACT_APP_API_URL=http://localhost:5000
        # Add other frontend-specific environment variables
        ```

4.  **Setup the RAG Chatbot:**
    -   Navigate to the chatbot directory:
        ```bash
        cd ../LocalAIAgentWithRAG-main
        ```
    -   It is highly recommended to use a Python virtual environment:
        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows use `venv\Scripts\activate`
        ```
    -   Install Python dependencies (assuming you have a `requirements.txt` file):
        ```bash
        pip install -r requirements.txt
        ```
    -   Create a `.env` file for API keys (e.g., OpenAI) and other configurations.
    -   Edit the `.env` file with your necessary keys:
        ```
        OPENAI_API_KEY=your_api_key_here
        # Add other RAG-bot-specific environment variables
        ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    # In the /backend directory
    npm start
    ```

2.  **Start the Frontend Application:**
    ```bash
    # In the /frontend directory
    npm start
    ```

3.  **Start the RAG Chatbot Service:**
    ```bash
    # In the /LocalAIAgentWithRAG-main directory
    python app.py
    ```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.