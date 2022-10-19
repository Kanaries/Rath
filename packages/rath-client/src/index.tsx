import React from 'react';
import ReactDOM from 'react-dom';
import { initializeIcons } from '@fluentui/font-icons-mdl2'
import 'office-ui-fabric-core/dist/css/fabric.css'
import './index.css';
import App from './App';

initializeIcons()

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
