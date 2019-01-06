import React from 'react';
import { mount } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { ScriptOutput } from '../src/ScriptOutput';

describe('ScriptOutput', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy], { script: { present: {
      drawCommands: [
        { id: 123, x1: 234, y1: 345, x2: 456, y2: 567 },
        { id: 234, x1: 234, y1: 345, x2: 456, y2: 567 },
        { id: 567, x1: 234, y1: 345, x2: 456, y2: 567 }
      ]
    }}});
  });

  function mountWithStore(component) {
    return mount(<StoreContext.Provider value={store}>{component}</StoreContext.Provider>);
  }

  function svg() {
    return wrapper.find('svg');
  }

  it('renders an svg inside div#viewport', () => {
    wrapper = mountWithStore(<ScriptOutput />);
    expect(wrapper.find('div#viewport > svg').exists()).toBeTruthy();
  });

  it('sets a viewbox of +/- 300 in either axis and preserves aspect ratio', () => {
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().exists()).toBeTruthy();
    expect(svg().prop('viewBox')).toEqual('-300 -300 600 600');
    expect(svg().prop('preserveAspectRatio')).toEqual('xMidYMid slice');
  });

  it('draws a line for a draw command in state', () => {
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().childAt(0).type()).toEqual('line');
    expect(svg().childAt(0).prop('x1')).toEqual(234);
    expect(svg().childAt(0).prop('y1')).toEqual(345);
    expect(svg().childAt(0).prop('x2')).toEqual(456);
    expect(svg().childAt(0).prop('y2')).toEqual(567);
  });

  it('sets a stroke width of 2 on each line', () => {
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().childAt(0).prop('strokeWidth')).toEqual('2');
  });

  it('sets a stroke color of black on each line', () => {
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().childAt(0).prop('stroke')).toEqual('black');
  });

  it('draws every command', () => {
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().children().length).toEqual(3);
  });
});
