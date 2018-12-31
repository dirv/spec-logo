import React from 'react';
import { useDispatch, useMappedState } from 'redux-react-hook';
const { useEffect, useRef, useState, useCallback } = React;

const ifEnterKey = (e, func) => { if (e.key === 'Enter') { func(); } };

export const ScriptName = () => {
  const mapState = useCallback(({ script: { name } }) => ({ name }), []);

  const { name } = useMappedState(mapState);
  const dispatch = useDispatch();
  const submitScriptName = useCallback(text => dispatch({ type: 'SUBMIT_SCRIPT_NAME', text }), []);
  const promptFocusRequest = useCallback(text => dispatch({ type: 'PROMPT_FOCUS_REQUEST' }));

  const [ updatedScriptName, setScriptName ] = useState(name);
  const [ editingScriptName, setEditingScriptName ] = useState(false);

  const toggleEditingScriptName = () => setEditingScriptName(!editingScriptName);
  const completeEditingScriptName = () => {
    if (editingScriptName) {
      toggleEditingScriptName();
      submitScriptName(updatedScriptName);
      promptFocusRequest();
    }
  };

  const beginEditingScriptName = () => {
    toggleEditingScriptName();
  };

  return <input id="name"
    className={editingScriptName ? "isEditing" : null}
    value={updatedScriptName}
    onFocus={beginEditingScriptName}
    onChange={e => setScriptName(e.target.value) }
    onKeyPress={e => ifEnterKey(e, completeEditingScriptName) }
    onBlur={completeEditingScriptName} />;
};
