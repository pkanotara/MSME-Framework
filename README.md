# ChatServe

## Functionality Overview
ChatServe is a powerful chat application designed for real-time communication. It supports features such as group chats, direct messaging, message history, and customizable user profiles.

## Detailed Architecture
The architecture consists of three main components:
1. **Client-side**: Built using React for a responsive user experience.
2. **Server-side**: A Node.js backend that manages authentication, message delivery, and data storage.
3. **Database**: MongoDB for storing user data and message history.

## Component Descriptions
- **Client**: The front-end interface allowing users to interact with the chat application.
- **Server**: The backend service that processes requests and coordinates the web socket connections.
- **Database**: Responsible for persisting data across user sessions and facilitating quick retrieval of chat histories.

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/pkanotara/ChatServe.git
   cd ChatServe
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the application**:
   - For development:
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

4. **Access the application** in your browser at `http://localhost:3000`.  
5. **Configuration**: Update the configuration file `.env` with your database credentials and settings.

Happy chatting!