import React from 'react';
import { connect } from 'react-redux';
const { useEffect, useRef, useState } = React;

const ifEnterKey = (e, func) => { if (e.key === 'Enter') { func(); } };

export const ScriptName = connect(({ script: { name } }) => ({ name }), {
  submitScriptName: text => ({ type: 'SUBMIT_SCRIPT_NAME', text: text })
})(({ name, submitScriptName }) => {

  const [ updatedScriptName, setScriptName ] = useState(name);
  const [ editingScriptName, setEditingScriptName ] = useState(false);

  const toggleEditingScriptName = () => setEditingScriptName(!editingScriptName);
  const completeEditingScriptName = () => {
    toggleEditingScriptName();
    submitScriptName(updatedScriptName);
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
});
