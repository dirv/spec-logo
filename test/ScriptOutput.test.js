import React from 'react';
import ReactDOM from 'react-dom';
import { mount } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { ScriptOutput } from '../src/ScriptOutput';

describe('ScriptOutput', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy]);
  });

  function mountWithStore(component) {
    return mount(<StoreContext.Provider value={store}>{component}</StoreContext.Provider>);
  }

  function svg() {
    return wrapper.find('svg');
  }

  function drawLine() {
    store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
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
    drawLine();
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().childAt(0).type()).toEqual('line');
    expect(svg().childAt(0).prop('x1')).toEqual(0);
    expect(svg().childAt(0).prop('y1')).toEqual(0);
  });

  it('initially sets end of line to beginning of line, ready for animation', () => {
    drawLine();
    expect(svg().childAt(0).prop('x2')).toEqual(0);
    expect(svg().childAt(0).prop('y2')).toEqual(0);
  });

  it('sets a stroke width of 2 on each line', () => {
    drawLine();
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().childAt(0).prop('strokeWidth')).toEqual('2');
  });

  it('sets a stroke color of black on each line', () => {
    drawLine();
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().childAt(0).prop('stroke')).toEqual('black');
  });

  it('draws every command', () => {
    drawLine();
    drawLine();
    drawLine();
    wrapper = mountWithStore(<ScriptOutput />);
    expect(svg().children().length).toEqual(3);
  });

  describe('animating', () => {
    describe('x2 coordinate', () => {
      it('renders animate element', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(0).type()).toEqual('animate');
        expect(firstLine.childAt(0).prop('attributeName')).toEqual('x2');
        expect(firstLine.childAt(0).prop('to')).toEqual(10);
      });

      it('sets the begin time to 0 when component first mounts', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(0).prop('begin')).toEqual(0);
      });

      it('has a duration of 0.5s', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(0).prop('dur')).toEqual(0.5);
      });

      it('sets the fill to freeze', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(0).prop('fill')).toEqual('freeze');
      });
    });

    describe('y2 coordinate', () => {
      it('renders animate element', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(1).type()).toEqual('animate');
        expect(firstLine.childAt(1).prop('attributeName')).toEqual('y2');
        expect(firstLine.childAt(1).prop('to')).toEqual(0);
      });

      it('sets the begin time to 0 when component first mounts', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(1).prop('begin')).toEqual(0);
      });

      it('has a duration of 0.5s', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(1).prop('dur')).toEqual(0.5);
      });

      it('sets the fill to freeze', () => {
        drawLine();
        wrapper = mountWithStore(<ScriptOutput />);
        const firstLine = svg().childAt(0);
        expect(firstLine.childAt(1).prop('fill')).toEqual('freeze');
      });
    });

    it('creates x2 and y2 animations for every line drawn', () => {
      drawLine();
      drawLine();
      drawLine();
      wrapper = mountWithStore(<ScriptOutput />);
      expect(wrapper.find('animate').length).toEqual(6);
    });

    describe('later draw commands', () => {
      let timeSpy;
      let root;

      beforeEach(async () => {
        timeSpy = jest.fn();
        timeSpy.mockReturnValue(5);
        SVGSVGElement.prototype.getCurrentTime = timeSpy;
        root = document.createElement('div');
        wrapper = mountWithStore(<ScriptOutput />);
        drawLine();
        drawLine();
        await new Promise(setTimeout);
        wrapper = wrapper.update();
      });

      it('uses getCurrentTime function to find current document animation time on second render', () => {
        expect(timeSpy).toHaveBeenCalled();
      });

      it('sets the first new draw command begin to the current time', () => {
        expect(wrapper.find('line').at(0).childAt(0).prop('begin')).toEqual(5);
      });

      it('sets the next draw command to that time plus the duration', () => {
        expect(wrapper.find('line').at(1).childAt(0).prop('begin')).toEqual(5.5);
      });
    });
  });
});
