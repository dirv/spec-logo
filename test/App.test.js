import React from 'react';
import { shallow } from 'enzyme';
import { App } from '../src/App';
import { MenuButtons } from '../src/MenuButtons';
import { StatementHistory } from '../src/StatementHistory';
import { ScriptName } from '../src/ScriptName';
import { ReduxConnectedDisplay } from '../src/Display';
import { Prompt } from '../src/Prompt';
import { PromptError } from '../src/PromptError';

describe('App', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<App />);
  });

  it('renders a ScriptName component as the first item in  the menu', () => {
    expect(wrapper.find('#menu').childAt(0).type()).toEqual(ScriptName);
  });

  it('renders a MenuButtons component as the second items in the menu', () => {
    expect(wrapper.find('#menu').childAt(1).type()).toEqual(MenuButtons);
  });

  it('renders a ReduxConnectedDisplay component in div#drawing', () => {
    expect(wrapper.find('#drawing > ReduxConnectedDisplay').exists()).toBeTruthy();
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
