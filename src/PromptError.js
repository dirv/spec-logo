import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback } = React;

export const PromptError = () => {
  const mapState = useCallback(({ script: { present: { error } } }) => ({ error }), []);
  const { error } = useMappedState(mapState);

  return <tbody key="error">
      <tr>
        <td colSpan="2">{error && error.description}</td>
      </tr>
    </tbody>;
};
