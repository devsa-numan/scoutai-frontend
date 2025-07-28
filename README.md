# Scout AI Frontend

A modern React application built with Vite, Redux Toolkit, and React Router DOM.

## 🚀 Features

- **Modern React Setup**: Built with Vite for fast development
- **State Management**: Redux Toolkit for predictable state management
- **Routing**: React Router DOM for client-side routing
- **Authentication**: Complete auth flow with protected routes
- **API Integration**: Axios with interceptors for API calls
- **Styling**: Tailwind CSS for modern UI design
- **Form Handling**: Controlled components with validation

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── LoginForm.jsx          # Login form component
│   └── layout/
│       └── ProtectedRoute.jsx     # Route protection component
├── pages/
│   ├── Login.jsx                  # Login page
│   └── Dashboard.jsx              # Dashboard page
├── services/
│   └── authAPI.js                 # Authentication API service
├── store/
│   ├── index.js                   # Redux store configuration
│   └── slices/
│       └── authSlice.js           # Authentication state slice
├── App.jsx                        # Main app component
└── main.jsx                       # App entry point
```

## 🛠️ Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3000/api/v1
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 🔧 Key Technologies

- **React 18**: Latest React features
- **Vite**: Fast build tool and dev server
- **Redux Toolkit**: Modern Redux with RTK
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client with interceptors
- **Tailwind CSS**: Utility-first CSS framework

## 🔐 Authentication Flow

1. **Login**: User submits credentials → Redux action → API call → Store token
2. **Protected Routes**: Check authentication → Redirect if not authenticated
3. **Token Refresh**: Automatic token refresh on 401 responses
4. **Logout**: Clear tokens and redirect to login

## 📡 API Integration

- **Base URL**: Configurable via environment variables
- **Interceptors**: Automatic token injection and refresh
- **Error Handling**: Centralized error handling
- **Loading States**: Built-in loading state management

## 🎨 Styling

- **Tailwind CSS**: Utility-first approach
- **Custom Gradients**: Beautiful gradient borders on focus
- **Responsive Design**: Mobile-first approach
- **Consistent Spacing**: Standardized spacing system

## 🚀 Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## 🔄 State Management

The app uses Redux Toolkit with the following slices:

- **authSlice**: Handles authentication state
  - User data
  - Authentication status
  - Loading states
  - Error handling

## 🛡️ Route Protection

- **ProtectedRoute**: HOC for protecting routes
- **Authentication Check**: Automatic token validation
- **Redirect Logic**: Smart redirects based on auth status

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)
