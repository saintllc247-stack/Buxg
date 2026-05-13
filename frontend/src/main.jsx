import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { AuthProvider } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import App from './App'
import theme from './theme'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LangProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
