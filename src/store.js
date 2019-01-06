import { createStore, compose, combineReducers } from 'redux';
import { logoReducer } from './reducers/logo';
import { withUndoRedo } from './reducers/withUndoRedo';
import { environmentReducer } from './reducers/environment';

export const configureStore = (storeEnhancers = [], initialState = {}) => {
  return createStore(
    combineReducers({
      script: withUndoRedo(logoReducer),
      environment: environmentReducer
    }),
    initialState,
    compose(...storeEnhancers)
  );
};
