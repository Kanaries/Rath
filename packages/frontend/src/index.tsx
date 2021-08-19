// redux rxjs mobx同时出现导致的symbol.observable的问题。
// 项目中react-beautiful-dnd 使用了redux
// https://github.com/benlesh/symbol-observable/issues/38
import 'symbol-observable'
import React from 'react';
import ReactDOM from 'react-dom';
import 'office-ui-fabric-core/dist/css/fabric.css'
import './index.css';
import App from './App';
import { initializeIcons } from '@uifabric/icons'
initializeIcons()

ReactDOM.render(
    <App />,
  document.getElementById('root')
);

if (process.env.NODE_ENV === 'production') {
  document.write(
    unescape(
      "%3Cspan id='cnzz_stat_icon_1279593444'%3E%3C/span%3E%3Cscript src='https://s9.cnzz.com/z_stat.php%3Fid%3D1279593444%26show%3Dpic1' type='text/javascript'%3E%3C/script%3E"
    )
  );
}