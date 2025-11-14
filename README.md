# PeerEval: Online Peer Evaluation Tool

### Modernizing Team Feedback and Performance Review

PeerEval is a comprehensive full-stack application designed to streamline the peer-review process for collaborative environments, such as project-based learning, corporate team assessments, or hackathons. It moves away from cumbersome manual spreadsheets by providing a centralized platform for team members to rate their peers based on predefined criteria, generating aggregated scores and personalized feedback reports. 

## ✨ Features

* **Role-Based Access:** Separate dashboards for Instructors/Managers (creating projects, managing teams, assigning surveys) and Students/Employees (taking surveys, viewing personalized feedback).
* **Dynamic Survey Creation:** Define projects, teams, and custom evaluation criteria (e.g., communication, technical contribution, leadership).
* **Secure Authentication:** User registration, login, and robust password management (reset/update) for a secure environment.
* **Real-time Progress Tracking:** Instructors can view which assignments are complete and which students still need to submit their feedback.
* **Automated Reporting:** Calculation of aggregated peer scores and generation of detailed, downloadable PDF feedback reports for individual team members.
* **Team Management:** Features for inviting, assigning, and tracking members within project teams.

## 🚀 Tech Stack

This project is built using a modern, scalable technology stack:

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **Next.js** (React) | Full-featured frontend development, handling routing and server-side rendering. |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework for rapid and responsive UI development. |
| **Backend** | **Next.js API Routes** | Used for creating a robust and efficient serverless API layer. |
| **Database** | **Prisma** | Next-generation ORM for simplified database access (Schema files detected). |
| **Testing** | **Jest** / **Supertest** | Comprehensive unit and integration tests for API endpoints. |
| **Language** | **TypeScript** | Enhances code quality and maintainability across the entire stack. |

## 🛠️ Getting Started

### Prerequisites

You will need the following installed on your machine:

* Node.js (v18+)
* npm or yarn
* A running PostgreSQL database instance (or equivalent supported by Prisma)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [Your Repository URL Here]
    cd PeerEval
    ```

2.  **Navigate to the application folder and install dependencies:**
    ```bash
    cd my-app
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the `my-app` directory and add your database connection string and other secrets (e.g., `DATABASE_URL`, JWT secrets, etc.) based on your application needs.

4.  **Setup Database:**
    Run Prisma migrations to create the necessary tables defined in `prisma/schema.prisma`.
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Run the application:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

The project includes comprehensive test suites for the API logic.

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

## 👥 Contributors
This project was built in collaboration with:

[@Rohan-756] (Developer)

[@Rogue-05] (Developer)

[@RishabhJawagal] (Developer)

[@NikhileshVIyer] (Developer)

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
