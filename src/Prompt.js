import React from 'react';
import { connect } from 'react-redux';
const { useEffect, useRef, useState } = React;

export const SubmittedPromptLine = ({ text }) => {
  return (
    <tr>
      <td className="promptIndicator">&gt;</td>
      <td>{text}</td>
    </tr>
  );
};

const ifEnterKey = (e, func) => { if (e.key === 'Enter') { func(); }; }

export const EditPromptLine = connect(() => ({}), {
  submitEditLine: text => ({ type: 'SUBMIT_EDIT_LINE', text: text }),
  promptHasFocused: () => ({ type: 'PROMPT_HAS_FOCUSED' })
})(({ currentEditPrompt, nonEditableText, submitEditLine, nextInstructionId, focusRequest, promptHasFocused }) => {

  const [ currentInstructionId, setCurrentInstructionId ] = useState(nextInstructionId);
  const [ editPrompt, setEditPrompt ] = useState(currentEditPrompt);
  const inputRef = useRef();

  if (currentInstructionId != nextInstructionId) {
    setCurrentInstructionId(nextInstructionId);
    setEditPrompt(currentEditPrompt);
  }

  useEffect(() => {
    if (focusRequest) {
      inputRef.current.focus();
      promptHasFocused();
    }
  }, [inputRef]);

  return (
    <tr key={`prompt-edit}`}>
      <td className="promptIndicator">&gt;</td>
      <td>
        <input type="text"
          id="editLine"
          value={editPrompt}
          onChange={e => setEditPrompt(e.target.value)}
          onKeyPress={e => ifEnterKey(e, () => { submitEditLine(nonEditableText + editPrompt) })}
          ref={inputRef} />
      </td>
    </tr>
  );
});

export const exceptLast = xs => xs.slice(0, -1);

export const Prompt = connect(({
  script: { currentEditLine, nextInstructionId },
  environment: { promptFocusRequest } }) => ({ currentEditLine, nextInstructionId, promptFocusRequest }), {})(({ currentEditLine, nextInstructionId, promptFocusRequest }) => {

  const lines = currentEditLine.split('\n');

  const lastNewLine = currentEditLine.lastIndexOf('\n');
  const nonEditableText = currentEditLine.slice(0, lastNewLine + 1);

  return (
    <tbody key="prompt">
      {exceptLast(lines).map((line, i) => <SubmittedPromptLine key={i} text={line} />)}
      <EditPromptLine currentEditPrompt={lines[lines.length - 1]} nonEditableText={nonEditableText} nextInstructionId={nextInstructionId} focusRequest={promptFocusRequest} />
    </tbody>
  );
});

