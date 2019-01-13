import { createStore, compose, combineReducers, applyMiddleware } from 'redux';
import { logoReducer } from './reducers/logo';
import { withUndoRedo } from './reducers/withUndoRedo';
import { environmentReducer } from './reducers/environment';
import { save, load } from './middleware/localStorage';

export const configureStore = (storeEnhancers = [], initialState = {}) => {
  return createStore(
    combineReducers({
      script: withUndoRedo(logoReducer),
      environment: environmentReducer
    }),
    initialState,
    compose(...[applyMiddleware(save), ...storeEnhancers])
  );
};

export const configureStoreWithLocalStorage = () => configureStore(undefined, load());
