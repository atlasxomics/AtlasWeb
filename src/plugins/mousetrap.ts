import Mousetrap from 'mousetrap';

const originalStopCallback = Mousetrap.prototype.stopCallback;

function initMousetrap() {
  // initialize new properties and functions
  Mousetrap.paused = false;

  Mousetrap.pause = () => {
    Mousetrap.paused = true;
  };

  Mousetrap.unpause = () => {
    Mousetrap.paused = false;
  };

  // modify stopCallback function
  Mousetrap.prototype.stopCallback = (
    e: Mousetrap.ExtendedKeyboardEvent,
    element: Element,
    combo: string,
  ) => {
    if (Mousetrap.paused) {
      return true;
    }
    return originalStopCallback(e, element, combo);
  };
}

initMousetrap();
