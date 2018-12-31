import React from 'react';
import { shallow } from 'enzyme';
import { App } from '../src/App';
import { StatementHistory } from '../src/StatementHistory';
import { ScriptName } from '../src/ScriptName';
import { ScriptOutput } from '../src/ScriptOutput';
import { Prompt } from '../src/Prompt';
import { PromptError } from '../src/PromptError';

describe('App', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<App />);
  });

  it('renders a ScriptName component in div#menu', () => {
    expect(wrapper.find('#menu > ScriptName').exists()).toBeTruthy();
  });

  it('renders a ScriptOutput component in div#drawing', () => {
    expect(wrapper.find('#drawing > ScriptOutput').exists()).toBeTruthy();
  });

  it('renders a table in div#commands', () => {
    expect(wrapper.find('#commands > table').exists()).toBeTruthy();
  });

  it('renders a StatementHistory component as the first item in the table', () => {
    expect(wrapper.find('table').childAt(0).type()).toEqual(StatementHistory);
  });

  it('renders a Prompt component as the second item in the table', () => {
    expect(wrapper.find('table').childAt(1).type()).toEqual(Prompt);
  });

  it('renders a PromptError component as the third item in the table', () => {
    expect(wrapper.find('table').childAt(2).type()).toEqual(PromptError);
  });
});
