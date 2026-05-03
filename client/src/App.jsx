import './App.css'
import { AuthProvider } from './context/AuthContext.jsx'
import AnalyticsPage from './pages/Analytics.jsx'
import Dashboard from './pages/Dashbord.jsx'
import GroupsChatSystem from './pages/GroupsChatSystem.jsx'
import Index from './pages/Index.jsx'
import ProfileSettingsPage from './pages/ProfileSetting.jsx'
import Split from './pages/Split.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function App() {
  return(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<Index/>} />
          <Route path='/login' element={<Navigate to='/' replace />} />
          <Route path='/signUp' element={<Navigate to='/' replace />} />
          <Route path='/dashboard' element={<Dashboard/>} />
          <Route path='/split' element={<Split/>} />
          <Route path='/analytics' element={<AnalyticsPage/>} />
          <Route path='/transactions' element={<TransactionsPage/>} />
          <Route path='/profile' element={<ProfileSettingsPage/>} />
          <Route path='/chat' element={<GroupsChatSystem/>} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  ) 
}

export default App
