import './App.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { LiveDataProvider } from './context/LiveDataContext.jsx'
import AnalyticsPage from './pages/Analytics.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Blog from './pages/Blog.jsx'
import BlogArticle from './pages/BlogArticle.jsx'
import Dashboard from './pages/Dashbord.jsx'
import GroupsChatSystem from './pages/GroupsChatSystem.jsx'
import Index from './pages/Index.jsx'
import ProfileSettingsPage from './pages/ProfileSetting.jsx'
import Split from './pages/Split.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import ChatBot from './context/Chatbot.jsx'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from './context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  return(
    <BrowserRouter>
      <AuthProvider>
        <LiveDataProvider>
          <Routes>
            <Route path='/' element={<Index/>} />
            <Route path='/login' element={<AuthPage initialTab="login" />} />
            <Route path='/signUp' element={<AuthPage initialTab="signup" />} />
            <Route path='/blog' element={<Blog/>} />
            <Route path='/blog/:slug' element={<BlogArticle/>} />
            <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
            <Route path='/split' element={<ProtectedRoute><Split/></ProtectedRoute>} />
            <Route path='/analytics' element={<ProtectedRoute><AnalyticsPage/></ProtectedRoute>} />
            <Route path='/transactions' element={<ProtectedRoute><TransactionsPage/></ProtectedRoute>} />
            <Route path='/profile' element={<ProtectedRoute><ProfileSettingsPage/></ProtectedRoute>} />
            <Route path='/chat' element={<ProtectedRoute><GroupsChatSystem/></ProtectedRoute>} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
          <ChatBot />
        </LiveDataProvider>
      </AuthProvider>
    </BrowserRouter>
  ) 
}

export default App
