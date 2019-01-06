import React from 'react';
import { mount } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { StatementHistory } from '../src/StatementHistory';

describe('StatementHistory', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy], { script: { present: {
      parsedTokens: [
        { lineNumber: 1, text: 'abc' },
        { lineNumber: 1, text: 'def' },
        { lineNumber: 2, text: 'abc' },
        { lineNumber: 3, text: 'abc' }
      ]
    }}});
  });

  function mountWithStore(component) {
    return mount(<StoreContext.Provider value={store}><table>{component}</table></StoreContext.Provider>);
  }

  it('renders a tbody', () => {
    wrapper = mountWithStore(<StatementHistory />);
    expect(wrapper.find('tbody').exists()).toBeTruthy();
  });

  it('renders a table cell with the line number as the first cell in each row', () => {
    wrapper = mountWithStore(<StatementHistory />);
    const td = wrapper.find('tr').at(0).childAt(0);
    expect(td.text()).toEqual('1');
    expect(td.hasClass('lineNumber')).toBeTruthy();
  });

  it('renders a table cell with the joined tokens as the second cell in each row', () => {
    wrapper = mountWithStore(<StatementHistory />);
    const td = wrapper.find('tr').at(0).childAt(1);
    expect(td.text()).toEqual('abcdef');
    expect(td.hasClass('text')).toBeTruthy();
  });

  it('renders a row for each line', () => {
    wrapper = mountWithStore(<StatementHistory />);
    const trs = wrapper.find('tr');
    expect(wrapper.find('tr').length).toEqual(3);
  });
});
