import React from 'react';
import { connect } from 'react-redux';
const { useState } = React;

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
  submitEditLine: text => ({ type: 'SUBMIT_EDIT_LINE', text: text })
})(({ currentEditPrompt, nonEditableText, submitEditLine, nextInstructionId, focusRequest }) => {

  const [ currentInstructionId, setCurrentInstructionId ] = useState(nextInstructionId);
  const [ editPrompt, setEditPrompt ] = useState(currentEditPrompt);

  if (currentInstructionId != nextInstructionId) {
    setCurrentInstructionId(nextInstructionId);
    setEditPrompt(currentEditPrompt);
  }

  return (
    <tr key={`prompt-edit}`}>
      <td className="promptIndicator">&gt;</td>
      <td>
        <input type="text"
          id="editLine"
          value={editPrompt}
          onChange={e => setEditPrompt(e.target.value)}
          onKeyPress={e => ifEnterKey(e, () => { submitEditLine(nonEditableText + editPrompt) })} />
      </td>
    </tr>
  );
});

export const exceptLast = xs => xs.slice(0, -1);

export const Prompt = connect(({
  script: { currentEditLine, nextInstructionId } }) => ({ currentEditLine, nextInstructionId }), {})(({ currentEditLine, nextInstructionId }) => {

  const lines = currentEditLine.split('\n');

  const lastNewLine = currentEditLine.lastIndexOf('\n');
  const nonEditableText = currentEditLine.slice(0, lastNewLine + 1);

  return (
    <tbody key="prompt">
      {exceptLast(lines).map((line, i) => <SubmittedPromptLine key={i} text={line} />)}
      <EditPromptLine currentEditPrompt={lines[lines.length - 1]} nonEditableText={nonEditableText} nextInstructionId={nextInstructionId} />
    </tbody>
  );
});

