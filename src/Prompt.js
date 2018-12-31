import React from 'react';
import { useDispatch, useMappedState } from 'redux-react-hook';
const { useEffect, useRef, useState, useCallback } = React;

export const SubmittedPromptLine = ({ text }) => {
  return (
    <tr>
      <td className="promptIndicator">&gt;</td>
      <td>{text}</td>
    </tr>
  );
};

const ifEnterKey = (e, func) => { if (e.key === 'Enter') { func(); }; }

export const EditPromptLine = ({ currentEditPrompt, nonEditableText, nextInstructionId, focusRequest }) => {

  const dispatch = useDispatch();
  const submitEditLine = useCallback(text => dispatch({ type: 'SUBMIT_EDIT_LINE', text }));
  const promptHasFocused = useCallback(() => dispatch({ type: 'PROMPT_HAS_FOCUSED' }));

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
  }, [focusRequest]);

  useEffect(() => {
    inputRef.current.focus();
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
};

export const exceptLast = xs => xs.slice(0, -1);

export const Prompt = () => {
  const mapState = useCallback(({
    script: { currentEditLine, nextInstructionId },
    environment: { promptFocusRequest } }) => ({ currentEditLine, nextInstructionId, promptFocusRequest }), []);

  const { currentEditLine, nextInstructionId, promptFocusRequest } = useMappedState(mapState);

  const lines = currentEditLine.split('\n');

  const lastNewLine = currentEditLine.lastIndexOf('\n');
  const nonEditableText = currentEditLine.slice(0, lastNewLine + 1);

  return (
    <tbody key="prompt">
      {exceptLast(lines).map((line, i) => <SubmittedPromptLine key={i} text={line} />)}
      <EditPromptLine currentEditPrompt={lines[lines.length - 1]} nonEditableText={nonEditableText} nextInstructionId={nextInstructionId} focusRequest={promptFocusRequest} />
    </tbody>
  );
};
