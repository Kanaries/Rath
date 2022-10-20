// redux rxjs mobx同时出现导致的symbol.observable的问题。
// 项目中react-beautiful-dnd 使用了redux
// https://github.com/benlesh/symbol-observable/issues/38
import 'symbol-observable'
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
