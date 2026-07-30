# QuickShow

QuickShow is a full-stack movie ticket booking web application built using the MERN stack. It allows users to browse movies, watch trailers, book seats, and purchase tickets online.

## Live Demo

Frontend:
https://quickshow-gilt-ten.vercel.app/

Backend:
https://quickshow-server-opal-sigma.vercel.app/

## Technologies Used

- React.js
- Node.js
- Express.js
- MongoDB
- Tailwind CSS
- Clerk Authentication
- Stripe Payment Gateway
- TMDB API
- Inngest
- Nodemailer

## Features

- User Authentication
- Browse Movies
- Movie Details
- TMDB Trailer Integration
- Seat Selection
- Stripe Payment
- Booking Confirmation Email
- Reminder Email Notifications
- Favorite Movies
- Admin Dashboard
- Add Shows
- Responsive Design

## Project Structure

```
QuickShow/
│
├── client/
└── server/
```

## Installation

### Clone the repository

```bash
git clone https://github.com/nishtha0910/QuickShow.git
```

### Install dependencies

For the client:

```bash
cd client
npm install
```

For the server:

```bash
cd server
npm install
```

### Run the project

Client:

```bash
npm run dev
```

Server:

```bash
npm run server
```

## Environment Variables

Create a `.env` file in the client and server directories and add the required environment variables for:

- MongoDB
- Clerk
- TMDB API
- Stripe
- Nodemailer
- Inngest

## Author

Nishtha Chaudhari
