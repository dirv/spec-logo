import React from 'react';
import { connect } from 'react-redux';

export const PromptError = connect(({ script: { error } }) => ({ error }), {})(({ error }) => {
  return <tbody key="error">
      <tr>
        <td colSpan="2">{error && error.description}</td>
      </tr>
    </tbody>;
});

