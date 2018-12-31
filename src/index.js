import React from 'react';
import ReactDOM from 'react-dom';
import { StoreContext } from 'redux-react-hook';
import { configureStore } from './store';
import { App } from './App';

ReactDOM.render(<StoreContext.Provider value={configureStore()}><App /></StoreContext.Provider>, document.getElementById('root'));
