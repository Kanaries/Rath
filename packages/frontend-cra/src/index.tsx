import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeIcons } from '@uifabric/icons'
initializeIcons()

ReactDOM.render(
    <App />,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);

if (process.env.NODE_ENV === 'production') {
  document.write(
    unescape(
      "%3Cspan id='cnzz_stat_icon_1279593444'%3E%3C/span%3E%3Cscript src='https://s9.cnzz.com/z_stat.php%3Fid%3D1279593444%26show%3Dpic1' type='text/javascript'%3E%3C/script%3E"
    )
  );
}