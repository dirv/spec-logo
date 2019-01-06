import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback } = React;

const groupByLineNumber = tokens => {
  return tokens.reduce((lines, token) => {
    if (lines[token.lineNumber]) {
      return { ...lines, [token.lineNumber]: [ ...lines[token.lineNumber], token ] };
    } else {
      return { ...lines, [token.lineNumber]: [ token ] };
    }
  }, {});
};

export const LineWithNumber = ({ number, tokens }) => {
  const fullTextLine = tokens.map(instruction => instruction.text).join('');
  return (
    <tr key={number.toString()}>
      <td className="lineNumber">{number}</td>
      <td className="text">{fullTextLine}</td>
    </tr>
  );
};

export const StatementHistory = () => {
  const mapState = useCallback(({script: { present: { parsedTokens } } }) => ({ parsedTokens }), []);
  const { parsedTokens } = useMappedState(mapState);

  const lines = groupByLineNumber(parsedTokens);

  return (
    <tbody key="acceptedStatements">
      {Object.keys(lines).map(lineNumber => <LineWithNumber key={lineNumber} number={lineNumber} tokens={lines[lineNumber]} />)}
    </tbody>
  );
};
