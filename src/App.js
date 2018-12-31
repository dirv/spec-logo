import React from 'react';
import { ScriptName } from './ScriptName';
import { ScriptOutput } from './ScriptOutput';
import { StatementHistory } from './StatementHistory';
import { Prompt } from './Prompt';
import { PromptError } from './PromptError';

export const App = () => <div id="mainWindow">
    <div id="menu">
      <ScriptName />
    </div>
    <div id="drawing">
      <ScriptOutput />
    </div>
    <div id="commands">
      <table>
        <StatementHistory />
        <Prompt />
        <PromptError />
      </table>
    </div>
  </div>;
