import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import router from './App'
import { RouterProvider } from 'react-router-dom'

ReactDOM.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
  document.getElementById('root')
)
