import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { StoreWrapper } from './store'

ReactDOM.render(
  <React.StrictMode>
    <StoreWrapper>
      <App />
    </StoreWrapper>
  </React.StrictMode>,
  document.getElementById('root')
)
