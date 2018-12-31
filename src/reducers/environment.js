import { dispatch } from 'redux';

const defaultState = {
  promptFocusRequest: false
};

export const environmentReducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'PROMPT_FOCUS_REQUEST':
      return { ...state, promptFocusRequest: true };
    case 'PROMPT_HAS_FOCUSED':
      return { ...state, promptFocusRequest: false };
    default:
      return state;
  }
  return state;
};
