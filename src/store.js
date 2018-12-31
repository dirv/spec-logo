import { createStore, compose, combineReducers } from 'redux';
import { logoReducer } from './reducers/logo';
import { environmentReducer } from './reducers/environment';

export const configureStore = (storeEnhancers = [], initialState = {}) => {
  return createStore(
    combineReducers({
      script: logoReducer,
      environment: environmentReducer
    }),
    initialState,
    compose(...storeEnhancers)
  );
};
